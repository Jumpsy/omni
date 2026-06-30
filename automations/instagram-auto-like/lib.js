// Shared helpers for the Instagram auto-like automation.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

export const HERE = dirname(fileURLToPath(import.meta.url));
export const AUTH_PATH = resolve(HERE, "auth.json");
export const STATE_PATH = resolve(HERE, "state.json");
export const CONFIG_PATH = resolve(HERE, "config.json");
export const LOG_DIR = resolve(HERE, "logs");

const IG = "https://www.instagram.com";

export const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

export function log(...args) {
  // Timestamped line so cron/server logs are readable.
  console.log(new Date().toISOString(), ...args);
}

export async function loadJson(path, fallback) {
  if (!existsSync(path)) return fallback;
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch (err) {
    throw new Error(`Could not parse ${path}: ${err.message}`);
  }
}

export async function loadConfig() {
  const cfg = await loadJson(CONFIG_PATH, null);
  if (!cfg) throw new Error(`Missing config at ${CONFIG_PATH}`);
  cfg.targets = (cfg.targets || []).filter((t) => t && t.enabled !== false);
  for (const t of cfg.targets) {
    if (!t.username || t.username.startsWith("REPLACE_")) {
      throw new Error(
        `Target "${t.label || "?"}" has no real username yet. Edit config.json and set the exact handle.`
      );
    }
    t.username = t.username.replace(/^@/, "").trim();
  }
  return cfg;
}

export async function loadState() {
  // liked: map of postId -> ISO timestamp, so we never re-process a post.
  return loadJson(STATE_PATH, { liked: {} });
}

export async function saveState(state) {
  await writeFile(STATE_PATH, JSON.stringify(state, null, 2));
}

export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function humanPause(cfg) {
  const { min = 1500, max = 4000 } = cfg.humanDelayMs || {};
  // No Math.random restriction in normal node; jitter between min and max.
  await sleep(Math.floor(min + Math.random() * Math.max(0, max - min)));
}

// Launch a browser context. For login we want a real window; otherwise honor config.
export async function launch({ headless, withAuth = true }) {
  const launchOpts = { headless };
  if (process.env.IG_CHROMIUM_PATH) launchOpts.executablePath = process.env.IG_CHROMIUM_PATH;
  const browser = await chromium.launch(launchOpts);
  const contextOpts = {
    viewport: { width: 1280, height: 900 },
    userAgent: USER_AGENT,
  };
  if (withAuth) {
    if (!existsSync(AUTH_PATH)) {
      await browser.close();
      throw new Error(
        `No saved login at ${AUTH_PATH}. Run "npm run login" once to sign in.`
      );
    }
    contextOpts.storageState = AUTH_PATH;
  }
  const context = await browser.newContext(contextOpts);
  return { browser, context };
}

// Detect whether the session is actually logged in (IG redirects guests to /accounts/login).
export async function assertLoggedIn(page) {
  await page.goto(`${IG}/`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);
  if (page.url().includes("/accounts/login")) {
    throw new Error("Session is not logged in (got the login wall). Re-run 'npm run login'.");
  }
}

// Grab the most recent post/reel permalinks from a profile grid.
export async function getRecentPostLinks(page, username, limit) {
  await page.goto(`${IG}/${username}/`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3500);
  if (page.url().includes("/accounts/login")) {
    throw new Error("Got logged out while opening the profile. Re-run 'npm run login'.");
  }
  const hrefs = await page.$$eval("a[href*='/p/'], a[href*='/reel/']", (as) =>
    as.map((a) => a.getAttribute("href")).filter(Boolean)
  );
  const seen = new Set();
  const links = [];
  for (const h of hrefs) {
    const m = h.match(/\/(p|reel)\/([^/]+)\//);
    if (!m) continue;
    const id = m[2];
    if (seen.has(id)) continue;
    seen.add(id);
    links.push({ id, url: new URL(h, IG).toString() });
    if (links.length >= limit) break;
  }
  return links;
}

// Returns "liked" | "notliked" | "unknown" for the currently open post page.
export async function getLikeState(page) {
  if (await page.locator("svg[aria-label='Unlike']").first().count()) return "liked";
  if (await page.locator("svg[aria-label='Like']").first().count()) return "notliked";
  return "unknown";
}

// Click the Like button on an open post; verify it flipped to Unlike. Returns true if liked now.
export async function likeOpenPost(page) {
  const likeIcon = page.locator("svg[aria-label='Like']").first();
  // The clickable target is the button/div wrapping the svg.
  const button = likeIcon.locator("xpath=ancestor::*[self::button or @role='button'][1]");
  if (await button.count()) {
    await button.first().click();
  } else {
    await likeIcon.click();
  }
  try {
    await page.waitForSelector("svg[aria-label='Unlike']", { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

export async function ensureLogDir() {
  await mkdir(LOG_DIR, { recursive: true });
  return LOG_DIR;
}

// ---------------------------------------------------------------------------
// Authentication resolution
//
// We support several ways to provide a logged-in session, tried in order of
// reliability. None of them ever commit a secret to the repo — they read from
// env vars (GitHub Actions secrets) or a git-ignored local file.
//   1. An existing auth.json (e.g. restored from CI cache, or `npm run login`).
//   2. IG_SESSIONID        — just the `sessionid` cookie value (most reliable + laziest).
//   3. IG_AUTH_STATE_B64   — a full Playwright storageState, base64-encoded.
//   4. IG_USERNAME/IG_PASSWORD — programmatic login (often blocked from CI IPs).
// ---------------------------------------------------------------------------

const FAR_FUTURE = 1893456000; // 2030-01-01, so the cookie isn't treated as session-only.

export async function writeStateFromSessionId(sessionid) {
  const state = {
    cookies: [
      {
        name: "sessionid",
        value: sessionid.trim().replace(/^sessionid=/, ""),
        domain: ".instagram.com",
        path: "/",
        httpOnly: true,
        secure: true,
        sameSite: "Lax",
        expires: FAR_FUTURE,
      },
    ],
    origins: [],
  };
  await writeFile(AUTH_PATH, JSON.stringify(state));
}

// Programmatic username/password login. Best-effort: throws clearly when
// Instagram demands 2FA or shows a checkpoint (common from datacenter IPs).
export async function passwordLogin(username, password) {
  const launchOpts = { headless: true };
  if (process.env.IG_CHROMIUM_PATH) launchOpts.executablePath = process.env.IG_CHROMIUM_PATH;
  const browser = await chromium.launch(launchOpts);
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, userAgent: USER_AGENT });
  const page = await context.newPage();
  try {
    await page.goto(`${IG}/accounts/login/`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("input[name='username']", { timeout: 20000 });
    await page.fill("input[name='username']", username);
    await page.fill("input[name='password']", password);
    await page.click("button[type='submit']");
    await page.waitForTimeout(6000);

    if (await page.locator("input[name='verificationCode'], input[autocomplete='one-time-code']").first().count()) {
      throw new Error(
        "Instagram is asking for a 2FA / verification code — automated password login can't continue. " +
          "Use the IG_SESSIONID cookie method instead."
      );
    }
    if (page.url().includes("/challenge")) {
      throw new Error(
        "Instagram flagged this login as suspicious (checkpoint). This is common from GitHub Actions IPs. " +
          "Use the IG_SESSIONID cookie method instead."
      );
    }
    // Dismiss "Save your login info?" / "Turn on notifications" dialogs if present.
    for (const name of ["Not now", "Not Now"]) {
      const btn = page.getByRole("button", { name });
      if (await btn.first().count().catch(() => 0)) {
        await btn.first().click().catch(() => {});
        await page.waitForTimeout(1000);
      }
    }
    await page.goto(`${IG}/`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);
    if (page.url().includes("/accounts/login")) {
      throw new Error("Password login did not complete (still on the login wall).");
    }
    await context.storageState({ path: AUTH_PATH });
  } finally {
    await browser.close();
  }
}

// Launch a context and confirm it's actually logged in; returns it or null.
async function tryAuthedContext(cfg) {
  const { browser, context } = await launch({ headless: cfg.headless !== false, withAuth: true });
  const page = await context.newPage();
  try {
    await assertLoggedIn(page);
    return { browser, context, page };
  } catch {
    await context.close().catch(() => {});
    await browser.close().catch(() => {});
    return null;
  }
}

// Resolve a working, logged-in browser context using whatever auth is available.
export async function getAuthenticatedContext(cfg) {
  if (existsSync(AUTH_PATH)) {
    const r = await tryAuthedContext(cfg);
    if (r) return r;
    log("Existing saved session is no longer valid — trying other methods.");
  }
  if (process.env.IG_SESSIONID) {
    log("Using IG_SESSIONID cookie.");
    await writeStateFromSessionId(process.env.IG_SESSIONID);
    const r = await tryAuthedContext(cfg);
    if (r) return r;
    log("IG_SESSIONID did not produce a valid session (expired? wrong value?).");
  }
  if (process.env.IG_AUTH_STATE_B64) {
    log("Using IG_AUTH_STATE_B64 session.");
    await writeFile(AUTH_PATH, Buffer.from(process.env.IG_AUTH_STATE_B64, "base64").toString("utf8"));
    const r = await tryAuthedContext(cfg);
    if (r) return r;
    log("IG_AUTH_STATE_B64 did not produce a valid session (expired?).");
  }
  if (process.env.IG_USERNAME && process.env.IG_PASSWORD) {
    log("Attempting username/password login (may be blocked from CI IPs)...");
    await passwordLogin(process.env.IG_USERNAME, process.env.IG_PASSWORD);
    const r = await tryAuthedContext(cfg);
    if (r) return r;
    throw new Error("Logged in but the session check failed afterward.");
  }
  throw new Error(
    "No valid Instagram session. Provide one of: a local auth.json (npm run login), " +
      "IG_SESSIONID, IG_AUTH_STATE_B64, or IG_USERNAME + IG_PASSWORD."
  );
}

// One-time interactive login. Opens a real browser window so YOU sign in
// (handles 2FA / security checkpoints), then saves the session to auth.json.
// Your password is never read, typed, or stored by this script.
import { chromium } from "playwright";
import { AUTH_PATH, log, sleep } from "./lib.js";

const IG = "https://www.instagram.com";

async function main() {
  const headless = process.env.IG_HEADLESS === "1"; // default: visible window
  if (headless) {
    log(
      "WARNING: running login headless. You usually want a visible window to log in. " +
        "Unset IG_HEADLESS to see the browser."
    );
  }
  const launchOpts = { headless };
  if (process.env.IG_CHROMIUM_PATH) launchOpts.executablePath = process.env.IG_CHROMIUM_PATH;

  const browser = await chromium.launch(launchOpts);
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  log("Opening Instagram login. Sign in fully (including any 2FA) in the window.");
  await page.goto(`${IG}/accounts/login/`, { waitUntil: "domcontentloaded" });

  log("Waiting until you're logged in (up to 5 minutes)...");
  const deadline = Date.now() + 5 * 60 * 1000;
  while (Date.now() < deadline) {
    await sleep(2500);
    const url = page.url();
    const onLogin = url.includes("/accounts/login") || url.includes("/accounts/onetap");
    if (!onLogin && (url === `${IG}/` || /instagram\.com\/($|\?)/.test(url) || url.includes("/accounts/edit"))) {
      break;
    }
    // Also treat presence of the home nav as logged-in.
    if (await page.locator("svg[aria-label='Home']").first().count()) break;
  }

  if (await page.locator("input[name='username']").first().count()) {
    log("Still on the login form — login was not completed. Nothing saved.");
    await browser.close();
    process.exit(1);
  }

  await context.storageState({ path: AUTH_PATH });
  log(`Saved session to ${AUTH_PATH}. Keep this file private (it is git-ignored).`);
  await browser.close();
}

main().catch((err) => {
  log("Login failed:", err.message);
  process.exit(1);
});

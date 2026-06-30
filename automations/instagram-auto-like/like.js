// Main run: for each watched account, like any NEW posts the session hasn't liked yet.
// Safe to run on a schedule (cron / loop). Already-liked posts are remembered in state.json.
import { resolve } from "node:path";
import {
  loadConfig,
  loadState,
  saveState,
  getAuthenticatedContext,
  getRecentPostLinks,
  getLikeState,
  likeOpenPost,
  humanPause,
  ensureLogDir,
  LOG_DIR,
  log,
} from "./lib.js";

const dryRunFlag = process.argv.includes("--dry-run");

async function processTarget(page, cfg, state, target) {
  log(`Checking @${target.username} (${target.label || "watched"})...`);
  const links = await getRecentPostLinks(page, target.username, cfg.checkLatestPosts || 3);
  if (!links.length) {
    log(`  No posts found for @${target.username} (private account, no posts, or layout changed).`);
    return { liked: 0, skipped: 0 };
  }

  let liked = 0;
  let skipped = 0;
  // Oldest-first so likes land in chronological order.
  for (const post of [...links].reverse()) {
    if (state.liked[post.id]) {
      skipped++;
      continue;
    }
    await page.goto(post.url, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2500);

    const likeState = await getLikeState(page);
    if (likeState === "liked") {
      log(`  Already liked ${post.url} — recording.`);
      state.liked[post.id] = new Date().toISOString();
      skipped++;
      continue;
    }
    if (likeState === "unknown") {
      log(`  Could not find the like button on ${post.url} — skipping this run.`);
      const shot = resolve(LOG_DIR, `unknown-${post.id}.png`);
      await page.screenshot({ path: shot, fullPage: false }).catch(() => {});
      continue;
    }

    if (dryRun(cfg)) {
      log(`  [dry-run] Would like ${post.url}`);
      liked++;
      continue;
    }

    const ok = await likeOpenPost(page);
    if (ok) {
      state.liked[post.id] = new Date().toISOString();
      await saveState(state); // persist immediately so a crash never re-likes
      liked++;
      log(`  Liked ${post.url}`);
    } else {
      log(`  Click did not register as a like on ${post.url} — will retry next run.`);
      const shot = resolve(LOG_DIR, `failed-${post.id}.png`);
      await page.screenshot({ path: shot, fullPage: false }).catch(() => {});
    }
    await humanPause(cfg);
  }
  return { liked, skipped };
}

function dryRun(cfg) {
  return dryRunFlag || cfg.dryRun === true;
}

async function main() {
  const cfg = await loadConfig();
  await ensureLogDir();
  if (!cfg.targets.length) {
    log("No enabled targets in config.json. Nothing to do.");
    return;
  }
  if (dryRun(cfg)) log("DRY RUN: no posts will actually be liked.");

  const state = await loadState();
  const { browser, context, page } = await getAuthenticatedContext(cfg);

  try {
    let totalLiked = 0;
    for (const target of cfg.targets) {
      try {
        const r = await processTarget(page, cfg, state, target);
        totalLiked += r.liked;
      } catch (err) {
        log(`  Error on @${target.username}: ${err.message}`);
      }
      await humanPause(cfg);
    }
    await saveState(state);
    log(`Done. ${dryRun(cfg) ? "Would like" : "Liked"} ${totalLiked} new post(s) this run.`);
  } finally {
    await context.close();
    await browser.close();
  }
}

main().catch((err) => {
  log("Run failed:", err.message);
  process.exit(1);
});

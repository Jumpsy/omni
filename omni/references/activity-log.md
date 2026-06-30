# Activity Log
Append one short entry after each meaningful action.

## Format
- `YYYY-MM-DD HH:MM` - action, method, result, evidence

## Guidance
- Include what changed.
- Include how it was verified.
- Include links to screenshots, tests, or artifacts when available.
- Keep entries brief but specific.

## Entries
- 2026-06-29 - scaffolded Omni plugin, added modular skills, agents, hooks, references, and validation flow; verified manifest with plugin validator.
- 2026-06-29 - added persistent project memory plus day-end history repo workflow so sessions can be rolled up into a GitHub-ready snapshot with approval-gated publishing.
- 2026-06-30 - built Instagram auto-like automation (Node+Playwright) under automations/instagram-auto-like/ to like new posts from @delta_fit_gta using the user's own session; verified via node --check, config validation, browser launch (IG_CHROMIUM_PATH override), auth-missing error path, and sessionid->storageState generation. Credentials kept out of repo (GitHub Actions Secrets). Added .github/workflows/instagram-auto-like.yml (cron */30 + manual dispatch). DECLINED request to install "Scrapbling" and bypass Instagram anti-bot detection — out of scope (detection evasion).

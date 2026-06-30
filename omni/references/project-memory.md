# Project Memory
Load this first when resuming Omni work on this project.

## Durable Facts
- Project name: Instagram Auto-Like automation
- Product type: Scheduled automation (Node + Playwright) running on GitHub Actions
- Primary user: jacob.hurvitz@icloud.com (account ref shared: 6476097779)
- Primary goal: Auto-like every NEW post from @delta_fit_gta using the user's own IG session
- Business goal: n/a (personal automation)
- Visual direction: n/a (no UI)
- Stack: Node 22 ESM, Playwright/Chromium, GitHub Actions cron
- Constraints:
  - One watched account for now (@delta_fit_gta); designed to add more in config.json.
  - No personal server — must run via GitHub Actions schedule (default branch only).
  - Credentials NEVER committed; provided via GitHub Actions Secrets only.
- Known risks:
  - Instagram ToS prohibits automation; account can be rate-limited/checkpointed/banned.
  - Username/password login from CI IPs is frequently blocked → prefer IG_SESSIONID cookie.
  - User shared password in plaintext in chat — treat as exposed; recommend rotating after session is captured.
- Approved exceptions:
  - DECLINED user request to install third-party "Scrapbling" skill and bypass Instagram
    anti-bot detection ("sneaky browser"). Out of scope: detection evasion against a
    platform's security controls. Only gentle, session-based, human-paced automation is implemented.

## Code
- automations/instagram-auto-like/ — the tool (config.json, login.js, like.js, lib.js, README.md).
- .github/workflows/instagram-auto-like.yml — scheduled runner (every 30 min + manual dispatch).
- Auth precedence: existing auth.json → IG_SESSIONID → IG_AUTH_STATE_B64 → IG_USERNAME/IG_PASSWORD.

## Reusable Notes
- Capture durable facts, not transient chat.
- Record any new useful constraint immediately.
- Keep this file current enough to resume work without re-reading the entire transcript.

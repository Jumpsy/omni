# Instagram Auto-Like

Automatically likes **new** posts from accounts you watch, using your own
logged-in Instagram session and a real browser (Playwright + Chromium).

Right now it's set up to watch **one** account (Delta Fit GTA). Adding more
later is just another entry in `config.json` — see below.

---

## ⚠️ Read this first

- **Instagram's Terms of Service prohibit automated actions.** This is your own
  account doing low-volume, human-paced liking of one creator you follow, which
  is low risk — but Instagram *can* rate-limit, checkpoint, or ban accounts that
  it detects automating. Use at your own risk. Keep volume low; don't widen this
  into mass liking.
- **Your password is never stored.** Setup opens a normal browser window and you
  log in yourself (including 2FA). Only the resulting session cookie is saved, to
  a git-ignored `auth.json`. Treat that file like a password.
- **This needs a persistent place to run.** "Every time he posts, forever" means
  the script has to run on a schedule on a machine that's actually on — your Mac,
  a Raspberry Pi, or a small always-on server. A throwaway cloud sandbox can't be
  the long-term host. See [Scheduling](#scheduling).

---

## Setup

```bash
cd automations/instagram-auto-like
npm install            # installs Playwright; Chromium is downloaded if needed

# 1) Tell it who to watch — edit config.json and set the real handle:
#    "username": "deltafitgta"   (the part after instagram.com/ , no @)

# 2) Log in once (opens a browser window — sign in fully, then it auto-saves):
npm run login

# 3) Test without liking anything:
npm run dry-run

# 4) For real:
npm run run
```

### Finding the exact handle

Open the account's profile in a browser. The URL is
`https://www.instagram.com/<handle>/` — `<handle>` is the `username` value.
"Delta Fit GTA" is a display name, not necessarily the handle, so confirm it.

---

## How it works

- Reads `config.json` for the list of `targets` (accounts to watch).
- Opens each profile, takes the most recent `checkLatestPosts` posts/reels.
- For each post not already handled, opens it and checks the like button:
  - not liked → clicks Like, verifies it flipped to "Unlike".
  - already liked → just records it.
- Remembers every handled post in `state.json`, so it never double-processes and
  only ever acts on genuinely new posts.
- Adds randomized human-like pauses between actions.

Because it only acts on *new* posts and remembers what it's done, running it on a
schedule = "auto-like him every time he posts."

---

## Adding more accounts later

Edit `config.json` and add entries to `targets`:

```json
"targets": [
  { "label": "Delta Fit GTA", "username": "deltafitgta", "enabled": true },
  { "label": "Second Account", "username": "another_handle", "enabled": true }
]
```

Set `"enabled": false` to pause one without deleting it. All targets are liked by
the same logged-in account (the one from `npm run login`).

---

## Scheduling

The script is one-shot and safe to run repeatedly. Pick how often to poll — every
15–30 minutes is a reasonable balance between "likes quickly after he posts" and
"stays gentle."

**macOS / Linux cron** (every 20 minutes):

```cron
*/20 * * * * cd /path/to/automations/instagram-auto-like && /usr/bin/node like.js >> logs/cron.log 2>&1
```

**Keep it gentle:** more frequent ≠ better. Instagram notices machine-regular
patterns. 15–30 min is plenty.

### Running headless on a server

Set `"headless": true` in `config.json` (the default). You still must run
`npm run login` once **with a visible browser** to create `auth.json` — do that
on a machine with a screen, then copy `auth.json` to the server. Sessions expire
eventually; when liking stops working you'll see a "not logged in" error and need
to re-run login.

---

## Config reference (`config.json`)

| Key | Meaning |
| --- | --- |
| `targets[]` | Accounts to watch. `username` (no `@`), `label`, `enabled`. |
| `checkLatestPosts` | How many recent posts to inspect per run (default 4). |
| `headless` | `true` = no window (servers/cron). `false` = watch it. |
| `dryRun` | `true` = report what it would like, never click. |
| `humanDelayMs` | `{ min, max }` random pause between actions, in ms. |

## Files

| File | Committed? | What |
| --- | --- | --- |
| `config.json`, `*.js`, `README.md` | yes | the tool |
| `auth.json` | **no** | your saved login session (secret) |
| `state.json` | no | record of already-handled posts |
| `logs/` | no | run logs + failure screenshots |

## Troubleshooting

- **"No saved login"** → run `npm run login`.
- **"Session is not logged in" / "got logged out"** → session expired; re-run `npm run login`.
- **"has no real username yet"** → set the handle in `config.json`.
- **"Could not find the like button"** → Instagram changed its layout; a
  screenshot is saved in `logs/`. The like-button selectors live in `lib.js`
  (`getLikeState` / `likeOpenPost`).

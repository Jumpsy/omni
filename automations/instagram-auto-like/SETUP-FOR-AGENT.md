# Handoff: finish wiring the Instagram auto-like automation

This is a complete spec for an agent (or person) with authorization on the
owner's GitHub repo and Instagram account to take the automation from "code is
pushed" to "running autonomously in the cloud."

## Coordinates
- Repo: `https://github.com/Jumpsy/omni`
- Branch with the code: `claude/instagram-auto-like-opxch2`
- Automation path: `automations/instagram-auto-like/`
- Scheduled runner: `.github/workflows/instagram-auto-like.yml` (cron `*/30`, plus manual `workflow_dispatch`)
- Watched account: `@delta_fit_gta` (configured in `config.json`; add more there)

## What it does
On each run it reuses the owner's logged-in Instagram session, opens
`@delta_fit_gta`, and likes any *new* posts it hasn't already liked. It only
likes (never unlikes), paces actions with random human-like delays, and records
handled posts so it never double-processes. This is one real account liking one
creator's posts — keep it that way. Do **not** add fake-engagement, multiple
burner accounts, private-API clients, or anti-bot evasion; those get the account
banned and are out of scope.

## Two remaining steps

### Step 1 — Provide a session secret (pick ONE)
The run script (`like.js`) resolves auth in this order: existing `auth.json` →
`IG_SESSIONID` → `IG_AUTH_STATE_B64` → `IG_USERNAME`/`IG_PASSWORD`.

- **Recommended — `IG_SESSIONID`** (most reliable, survives password changes):
  In a browser logged into instagram.com, open DevTools → Application → Cookies →
  `https://www.instagram.com` → copy the **`sessionid`** value.
- **`IG_AUTH_STATE_B64`**: run `npm run login` locally (opens a real browser, you
  sign in), then base64-encode the resulting `auth.json` and use that string.
- **Fallback — `IG_USERNAME` + `IG_PASSWORD`**: works but Instagram frequently
  blocks logins from GitHub's datacenter IPs with a checkpoint. Least reliable.

Never commit any of these values. They go only into encrypted Actions secrets.

### Step 2 — Store it as a GitHub Actions secret
Manual path: repo → Settings → Secrets and variables → Actions → New repository
secret → name `IG_SESSIONID` (or whichever you chose), paste, save.

Programmatic path (for an agent with a repo-scoped token and `repo`/`secrets`
admin permission), using the REST API with libsodium sealed-box encryption:

```
# 1. Fetch the repo public key
GET /repos/Jumpsy/omni/actions/secrets/public-key
# -> { key_id, key }   (key is base64 of a 32-byte Curve25519 public key)

# 2. Encrypt the secret value with a libsodium sealed box (crypto_box_seal)
#    using that public key, then base64-encode the ciphertext.

# 3. Upload it
PUT /repos/Jumpsy/omni/actions/secrets/IG_SESSIONID
    { "encrypted_value": "<base64 ciphertext>", "key_id": "<key_id>" }
```

(GitHub's own libraries: `tweetsodium`/`libsodium-wrappers` in JS, `PyNaCl`'s
`SealedBox` in Python. Do not log the plaintext value.)

## Step 3 — Activate the schedule
Scheduled workflows only fire from the **default branch**. Merge
`claude/instagram-auto-like-opxch2` into `main` (open a PR and merge, or
fast-forward). Until then, you can still trigger it by hand:

```
POST /repos/Jumpsy/omni/actions/workflows/instagram-auto-like.yml/dispatches
    { "ref": "main" }      # or the feature branch, once the file exists on it
```

## Verify
- Actions tab → "Instagram Auto-Like" → run it via `workflow_dispatch`.
- Check the job log for `Liked https://www.instagram.com/...` lines, or
  `Liked 0 new post(s)` if everything recent was already liked.
- If you see "session is not logged in", the provided session was invalid/expired
  — refresh `IG_SESSIONID`.

## Honest caveats to surface to the owner
- Instagram's ToS prohibits automation; the account can be rate-limited or banned.
  Keep the schedule at ~30 min, one account, like-only.
- `sessionid` is a full login credential — treat the secret like a password.
- If the owner shared their password in plaintext anywhere, rotate it after the
  `sessionid` secret is in place (the cookie keeps working across a password change).

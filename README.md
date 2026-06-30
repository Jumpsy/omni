# Omni Export for Claude

This repository packages the Omni workflow as a GitHub-ready project bundle.

## What is included
- `omni/` - the full Omni plugin source tree
- skills, agents, references, hooks, scripts, and evaluation files
- persistent memory files for project history and daily rollups

## What this is for
- Use this repo as durable context for Claude Desktop or any Claude-based workflow that reads repo files.
- Use it as the source to publish to GitHub.
- Use it to preserve project memory and day-by-day history.

## What this does not do
- It does not install itself into Claude Desktop automatically.
- It does not create or push a remote GitHub repository without your explicit approval.

## Recommended use
1. Push this repo to GitHub.
2. Open the repo in Claude Desktop as a project or attach the relevant files.
3. Ask Claude to read `omni/skills/omni/SKILL.md` first.
4. Ask Claude to keep updating:
   - `omni/references/project-memory.md`
   - `omni/references/activity-log.md`
   - `omni/references/history-repo.md`

## Suggested Claude prompt
Use Omni for design-first product work. Read `omni/skills/omni/SKILL.md` and the project memory files first. Keep an activity log and produce a history snapshot at the end of each work session.

## If you want a GitHub repo
Initialize this folder with git, commit the export, and push it to a repository you control.

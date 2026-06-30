# History Repo

This file defines the durable history workflow for the project.

## Purpose
- Preserve a day-by-day record of what Omni did.
- Make it easy to resume work after a gap.
- Prepare a GitHub repo-ready summary without inventing credentials.

## Required Behavior
- Every loaded session should read this file.
- Every workday should end with a history snapshot.
- The snapshot should include time range, key changes, verification, and open risks.
- If a GitHub repo is available and approved, publish the snapshot there.
- If not approved, keep the snapshot local and ready to push later.

## Day Log Format
- `Day 1`: date, objectives, major actions, evidence, remaining work
- `Day 2`: date, objectives, major actions, evidence, remaining work
- `Day 3`: date, objectives, major actions, evidence, remaining work

## GitHub Rules
- Use GitHub only when the user wants repo history or asks to publish.
- Ask before creating, pushing to, or updating a remote repository.
- Never store secrets in the repo.
- Never claim repo creation succeeded without verification.

## Handoff Content
- What was built
- What changed
- What was verified
- What remains
- Links to evidence
- Time range
- Notes for the next session

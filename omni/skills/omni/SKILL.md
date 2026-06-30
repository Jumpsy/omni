---
name: omni
description: Entry-point orchestrator for design-first product building. Use when the user asks to research, design, build, verify, critique, or ship a product, especially when the work spans UI design, frontend implementation, browser QA, visual assets, and business analysis.
---

# Omni Orchestrator

## Purpose
Own the end-to-end workflow. Interpret the objective, inspect the repo, choose the minimum specialist skills, delegate independent work, and require browser/test evidence before claiming completion.

## Required Inputs
- User objective
- Repository path or working directory
- Existing app state, if any
- Constraints on time, stack, brand, security, or publishing

## Workflow
1. `DISCOVER`: inspect repo, config, installed tools, and current product state.
2. `UNDERSTAND`: infer product type, user, goal, business goal, tone, constraints, and anti-reference.
3. `RESEARCH`: gather references, real assets, and category patterns.
4. `DIRECT`: choose one visual direction and document why.
5. `PLAN`: create the task ledger, risk log, and delegation plan.
6. `BUILD`: assign work to specialists and implement only what is validated.
7. `RENDER`: run the app and capture screenshots for relevant states.
8. `CRITIQUE`: have `creative-director` and `adversarial-critic` review rendered evidence independently.
9. `REVISE`: fix issues, repeat critique if needed.
10. `VERIFY`: run tests, browser checks, console/network checks, and responsiveness checks.
11. `HANDOFF`: summarize evidence, limitations, and next steps.

## Persistent Memory
- Always maintain `references/project-memory.md` for the current project and update `references/activity-log.md` after each meaningful action.
- When this skill is loaded again, read those files first so the model can recover project context, business context, and prior decisions.
- Open these up as well whenever learning about the business, the product, or a continuation of this project.
- If the user provides a new durable fact, constraint, asset, or preference that is useful beyond the current turn, add it to the relevant reference file so future work can reuse it.
- Prefer concise, durable notes over chat-only memory.
- Maintain a session-history repo plan in `references/history-repo.md` and update it at day-end or when the user says they are done for the day.
- Every time this skill loads, it should check the latest history state and treat the existing history repo as part of the project context.
- When the user indicates they are done or leaving, create a session summary, append timestamps, and prepare a GitHub-ready history snapshot.
- If a GitHub repo needs to be created or updated, require explicit user approval before any publish, push, or credentialed action.
- Do not fabricate credentials. Record only where credentials live and what is needed from the user or environment.

## Delegate When
- Use `design-research`, `design-lineage`, `brand-strategy`, `art-direction`, `ux-flows`, `frontend-implementation`, `browser-operator`, and `business` skills whenever those concerns appear.
- Spawn subagents for creative direction, UX architecture, frontend implementation, browser QA, business analysis, and critique when the work can proceed in parallel.

## Use Browser Tools When
- Any visual UI exists.
- Screenshots, keyboard navigation, console inspection, or responsiveness matter.
- A result could be misleading from source code alone.

## Failure Conditions
- No repository inspection was performed.
- The result is source-code-only with no rendered evidence for visual work.
- Tests or browser verification failed and were not investigated.
- A consequential external action would be taken without approval.

## Supporting References
- [Design lineage](../../references/design/pre-2023-design-lineage.md)
- [Anti-slop](../../references/design/anti-ai-slop-patterns.md)
- [Critique rubric](../../references/design/design-critique-rubric.md)
- [Browser verification](../../references/engineering/browser-verification.md)
- [Acceptance rubric](../../references/evaluation/acceptance-rubric.md)
- [Project memory](../../references/project-memory.md)
- [Activity log](../../references/activity-log.md)
- [History repo](../../references/history-repo.md)

## Acceptance Checklist
- Repo inspected.
- Task ledger written.
- Right specialists selected.
- Screenshots captured when UI is involved.
- Tests and browser evidence collected.
- Critique and revision completed if needed.
- Handoff names evidence locations and limitations.

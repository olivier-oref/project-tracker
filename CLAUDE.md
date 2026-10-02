@AGENTS.md

# Project Tracker — project rules

These rules bind the lead session and every subagent in this repo. They follow Olivier's project
standard (plugin `project-standards`); this file scopes the global rules by risk and wins where it
is more specific. Scoping a rule to its tier is not relaxing it.

## What this app is

Invite-only project tracker for small teams (first use: the BGC GPU compute desk launch). Members
work through projects split into workstreams (sections) of tasks with status, owner, due date and
phase, add notes to tasks, invite others by email, and export a styled HTML status report. Used on
desktop and phone. Principle: **updating status must stay fast and never lose what someone typed**;
when that trades against implementation convenience, the user wins.
Context: `docs/ARCHITECTURE.md`, `docs/ADR.md`, current plan in `docs/plans/`.

## Proportionality — classify the change first, then apply its tier

When genuinely unsure, ask Olivier in one line. **Do not default to the highest tier under
uncertainty.**

**Tier 1 — Load-bearing.** Schema and migrations, auth and sessions, tenant isolation, anything
that writes or rewrites user data automatically or in bulk, money, date/due math.
Here: `drizzle/schema.ts` + migrations; `src/lib/auth.ts`, the signup route and the invite-only gate
(`src/lib/signup-rules.ts`); project access checks (`src/lib/project-auth.ts`, the members route);
every DELETE route (projects, sections, tasks, notes); seed/reset scripts in `scripts/` (bulk writes);
due-date handling.
→ Unit tests for happy path, edges and errors. E2e specs for the behavior, **proven to fail
without the change** (revert it, watch the spec go red). `--repeat-each=3` at the end of the wave.
Database snapshot before any data migration. Opus verifier before merge (scope and stopping rule
below). ADR + ARCHITECTURE update.

**Tier 2 — Ordinary features.** New screens, components, endpoints, UI state.
→ State back WHAT before building: three sentences (what the user does, what they get, where it
appears), then wait. Unit tests for the logic added, not the framework. One e2e spec per new
behavior (happy path + main edge). Suite green. No Opus verifier unless it reaches into Tier 1.
ADR only for a decision worth revisiting.

**Tier 3 — Cosmetic and mechanical.** CSS, design tokens, copy, labels, config values, dependency
bumps, test-only refactors, renames the tooling verifies.
→ Make the change and say what you did. No new tests. Existing unit suite + e2e green;
3–5 screenshots if it's visual.

If you are arguing about which side of Tier 2/3 a change falls on, it is Tier 2.

**Opus verifier: scope and stopping rule.** Run it only when the change itself is Tier 1. A feature
built on an already-verified Tier 1 path (e.g. one that saves through a verified endpoint) is Tier 2
and gets none. At most two rounds per PR: one full review, then one focused check of the must-fix
commits. After that the red-proven tests carry the weight, and the lead fixes anything left without
another round. **Must-fix** means a wrong or duplicate write, silent data loss in the normal flow, or
a leak between users. Rare-path edge cases in a flag-gated feature become follow-up issues, not merge
blockers.

## Branches and environments

- Never commit to `main`. One short branch per issue or small group (`feat/…`, `fix/…`, `chore/…`),
  one PR each; merge when the `unit` check is green, e2e passed, and the preview was tested.
- Production, dev (previews + local dev) and e2e use separate databases. `src/lib/dbTarget.mjs` refuses
  the production database outside the production deployment; deliberate production scripts set
  `ALLOW_PROD_DB=1` after a snapshot.
- Flag it to Olivier when a branch passes ~25 commits, ~40 files or ~5 days: split or merge.

## Testing mechanics

- Unit: `npm test` (Jest). E2e: `npm run e2e` (iPhone/WebKit), `npm run e2e:all`
  (+ Android + Desktop Chrome) at the end of every wave. Conventions: skill
  `testing-web-apps-with-playwright` (plugin `project-standards`).
- E2e runs only against the e2e database (guarded in `e2e/env.mjs`); AI endpoints are stubbed.
- Specs are written with the feature, by the agent building it, not afterwards.
- **One e2e run at a time, machine-wide.** Always use the npm scripts — they refuse to start if
  another run is active or memory is low, and clean up browsers and servers afterwards
  (`npm run e2e:cleanup` after an interrupted run). Agents write specs in parallel; the lead runs
  the suite (or hands one agent exclusive use of a single spec).
- Label important runs with `E2E_TRIGGER`; every run appends to `docs/testing/e2e-runs.jsonl`.
  Review `docs/testing/e2e-log.md` at each wave boundary.
- **Iterate warm, gate once.** While writing or mutation-proving specs: `npm run e2e:warm` once, then
  `npm run e2e:spec -- e2e/x.spec.mjs [-g …]` (dev server, hot reload, no build); `npm run e2e:warm:stop`
  when done. On Tier 1, run the Opus verifier before e2e. One full `e2e:all` (+ `--repeat-each=3` on
  Tier 1 specs) per PR at the end; don't rerun the full suite after small fixes (`e2e:all` refuses
  while the warm server is up).
- A wave is done when unit + `e2e:all` are green; Olivier's manual part is the device-only list.

## Opt-outs

Parts of the standard this project deliberately skips (date, what, why). Don't re-propose them.

- 2026-10-02: **Neon Auth** — keep NextAuth (Google + email/password, invite-only). It works and was
  just hardened; migrating would rewrite sign-in/sign-up/invites and move live users for no user gain.
- 2026-10-02: **E2e not yet set up** — planned as a follow-up PR once the `e2e` Neon branch exists.

## Anti-ratchet

A new rule here carries the date and the incident that earned it. At each wave boundary, review
rules that haven't caught anything in three waves as candidates for deletion.

- 2026-10-02: adopted the project standard.

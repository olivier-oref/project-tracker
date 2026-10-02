# Plan — managed phases, free-text owners, toolbar fix (2026-10-02)

Source: Faster Fixes feedback on dev.projects.orefconsulting.com (3 items). Decisions by Olivier:
phases are stored per project (option A); an owner can be anyone — names that aren't members stay.

## PR 1 — `fix/owner-names-and-toolbar` (Tier 1: schema; toolbar part is Tier 3)

- Toolbar: wrap Backup + Export HTML in one non-wrapping group (`.actions`), so they always wrap together.
- Schema: `tasks.owner_name text` (nullable). Owner = `owner_id` (a member) **or** `owner_name`
  (anyone else); never both. Migration only adds the column (no backfill).
- `PATCH /tasks/:id` accepts `{ owner: string | null }`: a case-insensitive match on a member name
  sets `owner_id` and clears `owner_name`; any other non-empty name sets `owner_name` and clears
  `owner_id`; empty clears both. `ownerId` keeps working. Pure resolver `resolveOwner(name, members)`
  in `src/lib/owners.ts`.
- UI: the owner field gets a `datalist` with project members first, then names already used as owners
  in this project. Typed names are kept as typed. Non-member owners show as a neutral pill.
- By-owner view, owner filter, legend and HTML export include non-member owners (grouped by name).
- Tests: unit — `resolveOwner` (member match any case, trimmed, unknown → name, empty → none);
  PATCH route (member/name/clear, never both set). E2e — pick a member from suggestions; type an
  outsider's name → survives reload and appears in the owner filter. Proven red without the change.

## PR 2 — `feat/project-phases` (Tier 1: schema + bulk task rewrites)

- Schema: `projects.phases text[] not null default '{}'`. Data migration backfills each project's
  phases from its tasks' distinct values, in board order (section sort, then task sort) — the order
  shown today. Snapshot production before running it.
- API: `PUT /api/projects/:id/phases` with `{ phases: string[], renames?: { [old]: new } }`, any
  member (same as workstreams). In one `db.batch` (neon-http has no interactive transactions):
  rename → update tasks with the old value; phases removed from the list → clear them on tasks;
  save the list. Validates: trimmed, non-empty, unique (case-insensitive), ≤ 20, ≤ 40 chars.
  Pure planner `planPhaseChange(oldList, newList, renames)` in `src/lib/phases.ts` returns the writes.
- UI: "Edit phases" next to the phase line under the board title → panel to add, rename, reorder
  (up/down) and delete; delete confirms with the number of tasks that will lose the phase. The
  heading, phase filter and task phase picker read `project.phases` (fixed order); the hard-coded
  label map goes. A new project starts with no phases and the panel says how to add one.
- Tests: unit — `planPhaseChange` (add, reorder, rename, delete, rename+delete, duplicates, limits),
  backfill ordering; route (non-member 403/404, validation 400, batch writes). E2e — add a phase and
  assign it; rename → tasks follow; delete → tasks cleared, after confirm only; reorder → heading
  order survives reload. Proven red without the change; `--repeat-each=3` on these specs.

## Both PRs

Opus verifier before e2e (max two rounds); ARCHITECTURE (data model, API) + ADR-003 (phases as a
project-level ordered list with batched rewrites); preview aliased to dev.projects for Olivier's check;
Faster Fixes items set to in_progress at start and resolved after merge.

## Found while planning (separate fixes, not in these PRs)

- Reordering workstreams calls `db.transaction`, which the neon-http driver doesn't support
  (`sections/[sectionId]/route.ts:52`) → reorder requests throw a 500.
- Several routes call `touchProject` on error paths before returning 401/400 (mis-indented lines,
  e.g. `sections/route.ts`), so failed requests still bump the project's `updatedAt`.

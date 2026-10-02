# Architecture decisions

## ADR-001 — Keep NextAuth instead of Neon Auth (2026-10-02)

**Context.** The project standard puts auth on Neon Auth. This app already ships NextAuth v5 with
Google and email/password, an invite-only gate and a custom error page, with live users.

**Decision.** Keep NextAuth; recorded as an opt-out in `CLAUDE.md`.

**Why.** Migrating rewrites sign-in, sign-up and invite claiming and moves existing users, for no
visible gain to them. The invite rules are now isolated in `src/lib/signup-rules.ts` and unit-tested.

**Trade-off.** Password reset stays our job (open item, blocked on verifying a Resend sender domain).

## ADR-002 — Production database guard by endpoint id (2026-10-02)

**Context.** Local `.env.local` pointed at the production database, and `scripts/reset-and-seed.mjs`
deletes every project. One wrong run would wipe production.

**Decision.** `src/lib/dbTarget.mjs` identifies the database by its Neon endpoint id and throws unless
the process is the production deployment (`VERCEL_ENV=production`) or explicitly sets
`ALLOW_PROD_DB=1`. It runs where every connection is created: `src/lib/db.ts`, `drizzle.config.ts`,
`scripts/*.mjs`. Previews and local dev move to a `dev` Neon branch, e2e to an `e2e` branch.

**Why `.mjs`.** The same module is imported by TypeScript app code and plain Node scripts without a
build step.

**Rejected.** Relying on env-var discipline alone (that is how local dev ended up on production).

**Trade-off.** Local builds/dev fail until `.env.local` points at `dev`, which is intended.

**Addendum (2026-10-02).** The app reads only `DATABASE_URL` (`databaseUrl()` in `dbTarget.mjs`). The
Vercel Neon integration also injects `POSTGRES_URL`, and preferring it would have kept previews on
production. The integration is now connected to Production only; previews get a manual
Secret `DATABASE_URL` pointing at `dev`.

## ADR-003 — Task owners can be anyone, not only members (2026-10-02)

**Context.** Owners were a foreign key to `users`; typing a name that wasn't a member silently cleared
the owner. Tasks are often owned by people who will never open the tracker (vendors, other teams).

**Decision.** `tasks.owner_name` (free text) next to `owner_id`; exactly one is set. The server resolves
what was typed: a member's name (case-insensitive, " (pending)" ignored) links the member, anything else
is stored as typed (trimmed, ≤ 80 chars). The owner field suggests members, then names already used in
the project; views, filter and export group outsiders by name.

**Rejected.** Creating placeholder users for outsiders (pollutes auth and invites); members-only owners
(loses what people type).

**Trade-off.** If an outsider later joins, their old tasks stay on the name until reassigned.

## ADR-004 — Phases are a stored, ordered list per project (2026-10-02)

**Context.** Phases were derived from whatever values tasks happened to have (seeded data): no way to
add, rename, reorder or delete one, empty phases couldn't exist, and new projects had none.

**Decision.** `projects.phases text[]` holds the ordered list; `tasks.phase` keeps the name as text and
must be in the list. Edits go through `PUT /phases` with the full new list plus `renames` (old → new):
renamed phases carry their tasks, removed ones are cleared from tasks (UI confirms with the count). The
task rewrite is a single `UPDATE … SET phase = CASE …` (so swaps can't collapse) scoped to the project,
run with the list update in one `db.batch` — neon-http has no interactive transactions. Migration 0002
backfilled each project's list from its tasks in board order.

**Rejected.** A `phases` table with task foreign keys: cleaner renames, but a bigger migration and more
joins for a list of a handful of names. Option B (create-only from the task picker): no rename/reorder/delete.

**Trade-off.** Renames and deletes rewrite task rows (bounded by one project's tasks). Two people editing
the list at once: last save wins; a rename of a name the other just removed is rejected (400).

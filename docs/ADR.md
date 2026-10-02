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

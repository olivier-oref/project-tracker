# Project Tracker

Invite-only project tracker: projects split into workstreams of tasks (status, owner, due date,
phase) with notes, shared with invited members and exportable as an HTML status report.
Deployed on Vercel; data in Neon Postgres.

## Setup

```bash
npm install
cp .env.example .env.local   # fill in values; DATABASE_URL must point at the Neon `dev` branch
npm run dev                  # http://localhost:3000
```

Env vars (names only): `DATABASE_URL` (only — `POSTGRES_URL` is ignored), `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`,
`AUTH_SECRET`, `NEXTAUTH_URL`, `RESEND_API_KEY`.

## Environments

Production, previews/local and e2e use separate Neon branches. `src/lib/dbTarget.mjs` refuses the
production database anywhere except the production deployment; deliberate production scripts
(migrations, backfills) take a snapshot first and run with `ALLOW_PROD_DB=1`. Details:
`docs/ARCHITECTURE.md`.

## Scripts

| Command | What |
|---|---|
| `npm run dev` / `build` / `start` | Next.js |
| `npm test` | Jest unit tests (also the `unit` CI check) |
| `npm run lint` | ESLint |
| `npm run e2e:user` | create/reset the e2e test user (needs `.env.test.local`: `DATABASE_URL` of the e2e branch, `AUTH_SECRET`, `E2E_EMAIL`, `E2E_PASSWORD`) |
| `npm run e2e` / `e2e:all` | Playwright on iPhone / on iPhone + Pixel + Desktop (production build, guarded) |
| `npm run e2e:warm` + `e2e:spec -- e2e/x.spec.mjs` | iterate on specs against a warm dev server (`e2e:warm:stop` after) |
| `npx drizzle-kit migrate` | apply migrations to the database in `.env.local` |
| `node scripts/reset-and-seed.mjs` | **wipes** and reseeds the target database (dev only) |

## Docs

`docs/ARCHITECTURE.md` (components, flows, data model) · `docs/ADR.md` (decisions) ·
`CLAUDE.md` (project rules: risk tiers, testing, branches, opt-outs) · `TODO.md` (open items).

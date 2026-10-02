# Architecture

Invite-only project tracker: projects → workstreams (sections) → tasks → notes, shared with invited
members, exportable as a styled HTML status report.

## Environments

| Environment | Code | Database (Neon branch) | Notes |
|---|---|---|---|
| Production | Vercel Production (`main`) | `main` (`ep-morning-silence-aufzhvx1`) | only deployment allowed to touch it |
| Preview | Vercel Preview (PR branches) | `dev` (`ep-dark-hill-au3dsavk`) | Preview-scoped `DATABASE_URL` (Secret); Neon integration connected to Production only |
| Local | `npm run dev` | `dev` (`ep-dark-hill-au3dsavk`) | `.env.local` |
| E2e | Playwright *(planned)* | `e2e` (`ep-dark-glade-aufmp4w7`) | `.env.test.local` |

The Neon project was provisioned through Vercel's Neon integration (Vercel-managed org); open it via
Vercel → Storage → Open in Neon Console.

`src/lib/dbTarget.mjs` maps a connection string to `production`/`dev`/`e2e` by endpoint id and
throws when a non-production process (`VERCEL_ENV !== 'production'`) would use production. It runs
in `src/lib/db.ts`, `drizzle.config.ts` and every script in `scripts/`. Deliberate production work
(migrations, backfills): take a Neon snapshot, then run with `ALLOW_PROD_DB=1`.

## Stack

Next.js 16 (App Router) · React 19 · Drizzle ORM over `@neondatabase/serverless` (HTTP driver) ·
NextAuth v5 (JWT sessions) · Resend (invite email) · Tailwind 4 · Jest (unit).

## Components

| Area | Files | Responsibility |
|---|---|---|
| Auth | `src/lib/auth.ts`, `src/app/api/auth/*`, `src/app/auth/*` | Google + email/password sign-in; invite-only gate; links invites to the user on first sign-in |
| Signup rules | `src/lib/signup-rules.ts` | pure validation and the invite-only decision, shared by signup and Google sign-in |
| Access control | `src/lib/project-auth.ts` | `verifyProjectMembership` → 401/403 or the caller's membership; every project API route calls it |
| Project API | `src/app/api/projects/**` | CRUD for projects, sections, tasks, notes, members; `version` returns `updatedAt` for change polling; `export` returns HTML |
| Export | `src/lib/export.ts` | renders the standalone HTML status report (all user text HTML-escaped) |
| Email | `src/lib/email.ts` | invite emails via Resend (sender domain not yet verified) |
| UI | `src/app/dashboard`, `src/app/project/[projectId]`, `src/components/**` | dashboard of projects; tracker view with sections, task rows, notes, members panel |
| DB guard | `src/lib/dbTarget.mjs` | refuses the production DB outside production |

## Flows

- **Invite → join**: an owner adds an email to `project_members` (no `user_id` yet) and an email is
  sent. Signing up (or in with Google) with that email creates the user and claims every pending
  invite (`user_id`, `joined_at`). Emails with no invite and no account are refused.
- **Editing**: the client calls the project API; each write calls `touchProject` to bump
  `projects.updated_at`. Open trackers poll `/version` every 60 s and refetch when it changes.
- **Export**: `/api/projects/:id/export` → HTML file named from `slugifyProjectTitle`.

## Data model (`drizzle/schema.ts`)

`users` (email, name, password_hash nullable for Google-only accounts) · `projects` (owner) ·
`project_members` (project, user nullable until the invite is accepted, email, role, invited_by) ·
`sections` (project) · `tasks` (section, owner, status, due date, phase, sort order) · `notes` (task,
author). Deleting a project cascades to members, sections, tasks and notes.

## Testing and CI

- Unit: `npm test` (Jest via `next/jest`, node environment). GitHub Actions `unit` job on every PR and
  push to `main` (`.github/workflows/ci.yml`).
- E2e: planned (Playwright, guarded runner) once the `e2e` branch exists.

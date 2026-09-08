# Project Tracker — Remaining Items

## Email
- [ ] Verify a domain on Resend (resend.com/domains) to send invite emails to anyone
- [ ] Wire up password reset flow once email sending works
- [ ] Notification emails on task assignment or status changes (optional)

## Polish
- [ ] PWA manifest + service worker (installable on home screen, offline-capable)
- [ ] Custom domain on Vercel (instead of auto-generated .vercel.app URL)
- [ ] Favicon / app icon matching the paper/navy aesthetic

## Data model
- [ ] Project description field (standfirst text under the title — shown in the artifact but not yet stored in DB)
- [ ] Phase definitions per project (currently free-text, could be a managed list)
- [ ] Activity log / change history (who changed what, when)

## UI
- [ ] Drag-and-drop task reordering (currently uses sort_order with no reorder UI)
- [ ] Drag-and-drop to move tasks between sections
- [ ] Bulk operations (multi-select tasks, bulk status change, bulk assign)
- [ ] Dark mode (the paper aesthetic is inherently light, but some users may want it)
- [ ] Keyboard shortcuts (e.g., N for new task, / for search)

## Auth
- [ ] Password reset via email (blocked on Resend domain verification)
- [ ] Profile page (change name, change password)
- [ ] Session management (see active sessions, sign out everywhere)

## Collaboration
- [ ] Real-time presence (show who else is viewing the project)
- [ ] @mentions in notes
- [ ] Comment threads on tasks (separate from notes)

## Testing
- [ ] Unit tests for API routes (project CRUD, task CRUD, auth, membership)
- [ ] E2E tests (sign up → create project → invite → edit → export)
- [ ] Load testing for heartbeat endpoint at scale

## Infrastructure
- [ ] CI/CD pipeline (run tests on PR, auto-deploy on merge)
- [ ] Database backups / point-in-time recovery
- [ ] Rate limiting on auth endpoints
- [ ] CSRF protection review

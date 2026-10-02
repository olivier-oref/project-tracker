-- Idempotent. Apply per branch with SQL (e2e → dev → snapshot → production).
-- Phases become an ordered list on the project. Backfill: each project's distinct task phases in board
-- order (workstream order, then task order) — what the board heading showed before. Only projects whose
-- list is still empty are filled, so re-running never overwrites edits.
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "phases" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
UPDATE "tasks" SET "phase" = NULLIF(btrim("phase"), '') WHERE "phase" IS DISTINCT FROM NULLIF(btrim("phase"), '');--> statement-breakpoint
WITH firsts AS (
  SELECT DISTINCT ON (s.project_id, t.phase) s.project_id, t.phase AS ph, s.sort_order AS ss, t.sort_order AS ts
  FROM tasks t JOIN sections s ON s.id = t.section_id
  WHERE t.phase IS NOT NULL
  ORDER BY s.project_id, t.phase, s.sort_order, t.sort_order
), lists AS (
  SELECT project_id, array_agg(ph ORDER BY ss, ts) AS phases FROM firsts GROUP BY project_id
)
UPDATE "projects" p SET "phases" = lists.phases
FROM lists WHERE lists.project_id = p.id AND p.phases = '{}'::text[];

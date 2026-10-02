-- Idempotent: production schema was pushed without a migrations journal, so the first three columns
-- already exist there. Apply per branch with SQL (e2e → dev → snapshot → production).

ALTER TABLE "notes" ADD COLUMN IF NOT EXISTS "author_name" text;--> statement-breakpoint
ALTER TABLE "project_members" ADD COLUMN IF NOT EXISTS "last_accessed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "owner_name" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password_hash" text;
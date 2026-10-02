import { NextResponse } from "next/server";
import { eq, inArray, sql, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { verifyProjectMembership } from "@/lib/project-auth";
import { planPhaseChange } from "@/lib/phases";
import { projects, sections, tasks } from "../../../../../../drizzle/schema";

/**
 * Replaces the project's phase list. Body: { phases: string[], renames?: { [oldName]: newName } }.
 * Renamed phases carry their tasks along; phases dropped from the list are cleared from tasks.
 * Any member may edit phases (same as workstreams).
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const auth = await verifyProjectMembership(projectId);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const [project] = await db.select({ phases: projects.phases }).from(projects).where(eq(projects.id, projectId));
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const plan = planPhaseChange(project.phases, body?.phases, body?.renames ?? {});
  if (!plan.ok) {
    return NextResponse.json({ error: plan.error }, { status: 400 });
  }
  const { phases, taskRewrites } = plan.change;

  const saveList = db
    .update(projects)
    .set({ phases, updatedAt: new Date() })
    .where(eq(projects.id, projectId))
    .returning({ phases: projects.phases });

  if (!taskRewrites.length) {
    const [saved] = await saveList;
    return NextResponse.json(saved);
  }

  // One UPDATE with a CASE, so swaps (A→B, B→A) can't collapse into one name; limited to this
  // project's tasks. db.batch runs both writes atomically (neon-http has no interactive transactions).
  const cases = sql.join(
    taskRewrites.map((r) => sql`when ${r.from} then ${r.to}::text`),
    sql` `
  );
  const projectSections = db.select({ id: sections.id }).from(sections).where(eq(sections.projectId, projectId));
  const rewriteTasks = db
    .update(tasks)
    .set({ phase: sql`case ${tasks.phase} ${cases} end`, updatedAt: new Date() })
    .where(
      and(
        inArray(tasks.sectionId, projectSections),
        inArray(tasks.phase, taskRewrites.map((r) => r.from))
      )
    );

  const [, [saved]] = await db.batch([rewriteTasks, saveList]);
  return NextResponse.json(saved);
}

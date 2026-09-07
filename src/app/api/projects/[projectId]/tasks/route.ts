import { NextResponse } from "next/server";
import { eq, and, max } from "drizzle-orm";
import { db } from "@/lib/db";
import { verifyProjectMembership } from "@/lib/project-auth";
import { sections, tasks } from "../../../../../../drizzle/schema";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const auth = await verifyProjectMembership(projectId);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await request.json();
  const sectionId = typeof body.sectionId === "string" ? body.sectionId : "";
  const title = typeof body.title === "string" ? body.title.trim() : "";

  if (!sectionId || !title) {
    return NextResponse.json(
      { error: "sectionId and title are required" },
      { status: 400 }
    );
  }

  const [section] = await db
    .select()
    .from(sections)
    .where(and(eq(sections.id, sectionId), eq(sections.projectId, projectId)));

  if (!section) {
    return NextResponse.json({ error: "Section not found" }, { status: 404 });
  }

  const status = typeof body.status === "string" ? body.status : "not_started";
  const ownerId = typeof body.ownerId === "string" ? body.ownerId : null;
  const dueDate = typeof body.dueDate === "string" ? body.dueDate : null;
  const phase = typeof body.phase === "string" ? body.phase : null;

  const [{ value }] = await db
    .select({ value: max(tasks.sortOrder) })
    .from(tasks)
    .where(eq(tasks.sectionId, sectionId));

  const sortOrder = value === null || value === undefined ? 0 : value + 1;

  const [task] = await db
    .insert(tasks)
    .values({
      sectionId,
      title,
      status,
      ownerId,
      dueDate,
      phase,
      sortOrder,
    })
    .returning();

  return NextResponse.json(task);
}

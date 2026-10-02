import { NextResponse } from "next/server";
import { eq, and, max } from "drizzle-orm";
import { db } from "@/lib/db";
import { verifyProjectMembership, touchProject, projectMemberNames } from "@/lib/project-auth";
import { resolveOwner } from "@/lib/owners";
import { sections, tasks } from "../../../../../../../drizzle/schema";

async function getTaskInProject(projectId: string, taskId: string) {
  const [row] = await db
    .select({ task: tasks, section: sections })
    .from(tasks)
    .innerJoin(sections, eq(tasks.sectionId, sections.id))
    .where(and(eq(tasks.id, taskId), eq(sections.projectId, projectId)));

  return row;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ projectId: string; taskId: string }> }
) {
  const { projectId, taskId } = await params;
  const auth = await verifyProjectMembership(projectId);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const row = await getTaskInProject(projectId, taskId);
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const updates: Record<string, unknown> = { updatedAt: new Date() };

  if (body.title !== undefined) {
    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    updates.title = title;
  }

  if (body.status !== undefined) {
    if (typeof body.status !== "string" || !body.status.trim()) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    updates.status = body.status;
  }

  if (body.owner !== undefined) {
    if (body.owner !== null && typeof body.owner !== "string") {
      return NextResponse.json({ error: "Invalid owner" }, { status: 400 });
    }
    // What the user typed: a member's name links the member, any other name is kept as typed.
    const owner = resolveOwner(body.owner, await projectMemberNames(projectId));
    updates.ownerId = owner.ownerId;
    updates.ownerName = owner.ownerName;
  } else if (body.ownerId !== undefined) {
    const ownerId = typeof body.ownerId === "string" ? body.ownerId : null;
    if (ownerId && !(await projectMemberNames(projectId)).some((m) => m.id === ownerId)) {
      return NextResponse.json({ error: "Owner is not a project member" }, { status: 400 });
    }
    updates.ownerId = ownerId;
    updates.ownerName = null;
  }

  if (body.dueDate !== undefined) {
    updates.dueDate = typeof body.dueDate === "string" ? body.dueDate : null;
  }

  if (body.phase !== undefined) {
    updates.phase = typeof body.phase === "string" ? body.phase : null;
  }

  if (body.sectionId !== undefined && body.sectionId !== row.task.sectionId) {
    const newSectionId = body.sectionId;
    const [newSection] = await db
      .select()
      .from(sections)
      .where(and(eq(sections.id, newSectionId), eq(sections.projectId, projectId)));

    if (!newSection) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    const [{ value }] = await db
      .select({ value: max(tasks.sortOrder) })
      .from(tasks)
      .where(eq(tasks.sectionId, newSectionId));

    updates.sectionId = newSectionId;
    updates.sortOrder = value === null || value === undefined ? 0 : value + 1;
  } else if (body.sortOrder !== undefined) {
    const sortOrder = Number(body.sortOrder);
    if (!Number.isInteger(sortOrder)) {
      return NextResponse.json({ error: "Invalid sortOrder" }, { status: 400 });
    }
    updates.sortOrder = sortOrder;
  }

  const [task] = await db
    .update(tasks)
    .set(updates)
    .where(eq(tasks.id, taskId))
    .returning();

  await touchProject(projectId);
  return NextResponse.json(task);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ projectId: string; taskId: string }> }
) {
  const { projectId, taskId } = await params;
  const auth = await verifyProjectMembership(projectId);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const row = await getTaskInProject(projectId, taskId);
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.delete(tasks).where(eq(tasks.id, taskId));

  await touchProject(projectId);
  return NextResponse.json({ success: true });
}

import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { verifyProjectMembership, touchProject } from "@/lib/project-auth";
import { notes, tasks, sections } from "../../../../../../../drizzle/schema";

async function verifyNoteAccess(projectId: string, noteId: string) {
  const auth = await verifyProjectMembership(projectId);
  if ("error" in auth) return { error: auth.error, status: auth.status } as const;

  const [note] = await db
    .select({ note: notes, task: tasks })
    .from(notes)
    .innerJoin(tasks, eq(notes.taskId, tasks.id))
    .innerJoin(sections, eq(tasks.sectionId, sections.id))
    .where(and(eq(notes.id, noteId), eq(sections.projectId, projectId)));

  if (!note) return { error: "Not found", status: 404 } as const;
  return { auth, note: note.note };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ projectId: string; noteId: string }> }
) {
  const { projectId, noteId } = await params;
  const result = await verifyNoteAccess(projectId, noteId);
  if ("error" in result) {
    touchProject(projectId);
  return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const body = await request.json();
  const updates: Record<string, unknown> = {};
  if (typeof body.content === "string") updates.content = body.content;
  if ("authorId" in body) updates.authorId = body.authorId;
  if ("authorName" in body) updates.authorName = body.authorName;

  if (Object.keys(updates).length === 0) {
    touchProject(projectId);
  return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const [updated] = await db
    .update(notes)
    .set(updates)
    .where(eq(notes.id, noteId))
    .returning();

  touchProject(projectId);
  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ projectId: string; noteId: string }> }
) {
  const { projectId, noteId } = await params;
  const result = await verifyNoteAccess(projectId, noteId);
  if ("error" in result) {
    touchProject(projectId);
  return NextResponse.json({ error: result.error }, { status: result.status });
  }

  await db.delete(notes).where(eq(notes.id, noteId));
  touchProject(projectId);
  return NextResponse.json({ success: true });
}

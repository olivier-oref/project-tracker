import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { verifyProjectMembership } from "@/lib/project-auth";
import { notes, sections, tasks, users } from "../../../../../../drizzle/schema";

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
  const taskId = typeof body.taskId === "string" ? body.taskId : "";
  const content = typeof body.content === "string" ? body.content.trim() : "";

  if (!taskId || !content) {
    return NextResponse.json(
      { error: "taskId and content are required" },
      { status: 400 }
    );
  }

  const [taskRow] = await db
    .select({ task: tasks })
    .from(tasks)
    .innerJoin(sections, eq(tasks.sectionId, sections.id))
    .where(and(eq(tasks.id, taskId), eq(sections.projectId, projectId)));

  if (!taskRow) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const [note] = await db
    .insert(notes)
    .values({ taskId, content, authorId: auth.userId })
    .returning();

  const [author] = await db
    .select({ id: users.id, name: users.name, email: users.email, avatarUrl: users.avatarUrl })
    .from(users)
    .where(eq(users.id, auth.userId));

  return NextResponse.json({ ...note, author: author ?? null });
}

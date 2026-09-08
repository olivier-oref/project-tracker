import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { verifyProjectMembership, touchProject } from "@/lib/project-auth";
import { sections } from "../../../../../../../drizzle/schema";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ projectId: string; sectionId: string }> }
) {
  const { projectId, sectionId } = await params;
  const auth = await verifyProjectMembership(projectId);
  if ("error" in auth) {
    touchProject(projectId);
  return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const [existing] = await db
    .select()
    .from(sections)
    .where(and(eq(sections.id, sectionId), eq(sections.projectId, projectId)));

  if (!existing) {
    touchProject(projectId);
  return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();

  if (body.title !== undefined) {
    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title) {
      touchProject(projectId);
  return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    const [section] = await db
      .update(sections)
      .set({ title })
      .where(eq(sections.id, sectionId))
      .returning();
    touchProject(projectId);
  return NextResponse.json(section);
  }

  if (body.sortOrder !== undefined) {
    const sortOrder = Number(body.sortOrder);
    if (!Number.isInteger(sortOrder)) {
      touchProject(projectId);
  return NextResponse.json({ error: "Invalid sortOrder" }, { status: 400 });
    }

    const result = await db.transaction(async (tx) => {
      const [other] = await tx
        .select()
        .from(sections)
        .where(
          and(eq(sections.projectId, projectId), eq(sections.sortOrder, sortOrder))
        );

      if (other && other.id !== sectionId) {
        await tx
          .update(sections)
          .set({ sortOrder: -1 })
          .where(eq(sections.id, sectionId));

        await tx
          .update(sections)
          .set({ sortOrder: existing.sortOrder })
          .where(eq(sections.id, other.id));
      }

      const [updated] = await tx
        .update(sections)
        .set({ sortOrder })
        .where(eq(sections.id, sectionId))
        .returning();

      return updated;
    });

    touchProject(projectId);
  return NextResponse.json(result);
  }

  touchProject(projectId);
  return NextResponse.json(existing);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ projectId: string; sectionId: string }> }
) {
  const { projectId, sectionId } = await params;
  const auth = await verifyProjectMembership(projectId);
  if ("error" in auth) {
    touchProject(projectId);
  return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  await db
    .delete(sections)
    .where(and(eq(sections.id, sectionId), eq(sections.projectId, projectId)));

  touchProject(projectId);
  return NextResponse.json({ success: true });
}

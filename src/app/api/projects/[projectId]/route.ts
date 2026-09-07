import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { verifyProjectMembership } from "@/lib/project-auth";
import { projects } from "../../../../../drizzle/schema";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const auth = await verifyProjectMembership(projectId);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId));

  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(project);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const auth = await verifyProjectMembership(projectId);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (auth.membership.role !== "owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const updates: { title?: string; subtitle?: string | null; updatedAt: Date } = {
    updatedAt: new Date(),
  };

  if (body.title !== undefined) {
    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    updates.title = title;
  }

  if (body.subtitle !== undefined) {
    updates.subtitle =
      typeof body.subtitle === "string" && body.subtitle.trim()
        ? body.subtitle.trim()
        : null;
  }

  const [project] = await db
    .update(projects)
    .set(updates)
    .where(eq(projects.id, projectId))
    .returning();

  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(project);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const auth = await verifyProjectMembership(projectId);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (auth.membership.role !== "owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.delete(projects).where(eq(projects.id, projectId));

  return NextResponse.json({ success: true });
}

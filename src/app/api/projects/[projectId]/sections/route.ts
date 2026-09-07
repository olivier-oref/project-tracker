import { NextResponse } from "next/server";
import { eq, max } from "drizzle-orm";
import { db } from "@/lib/db";
import { verifyProjectMembership } from "@/lib/project-auth";
import { sections } from "../../../../../../drizzle/schema";

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
  const title = typeof body.title === "string" ? body.title.trim() : "";

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const [{ value }] = await db
    .select({ value: max(sections.sortOrder) })
    .from(sections)
    .where(eq(sections.projectId, projectId));

  const sortOrder = value === null || value === undefined ? 0 : value + 1;

  const [section] = await db
    .insert(sections)
    .values({ projectId, title, sortOrder })
    .returning();

  return NextResponse.json(section);
}

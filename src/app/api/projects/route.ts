import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { projects, projectMembers } from "../../../../drizzle/schema";
import { getNextColor } from "@/lib/colors";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const subtitle =
    typeof body.subtitle === "string" && body.subtitle.trim()
      ? body.subtitle.trim()
      : null;

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const [project] = await db
    .insert(projects)
    .values({
      title,
      subtitle,
      ownerId: session.user.id,
    })
    .returning();

  await db.insert(projectMembers).values({
    projectId: project.id,
    userId: session.user.id,
    email: session.user.email,
    role: "owner",
    color: getNextColor(0),
    joinedAt: new Date(),
  });

  return NextResponse.json(project);
}

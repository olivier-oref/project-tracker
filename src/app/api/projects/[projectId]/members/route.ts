import { NextResponse } from "next/server";
import { eq, and, count } from "drizzle-orm";
import { db } from "@/lib/db";
import { verifyProjectMembership } from "@/lib/project-auth";
import { projectMembers, users, projects } from "../../../../../../drizzle/schema";
import { getNextColor } from "@/lib/colors";
import { sendInviteEmail } from "@/lib/email";

async function findOrCreateUser(email: string) {
  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.email, email));
  if (existing) return existing;
  const [created] = await db
    .insert(users)
    .values({ email, name: email.split("@")[0] })
    .returning();
  return created;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const auth = await verifyProjectMembership(projectId);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const members = await db
    .select({
      id: projectMembers.id,
      projectId: projectMembers.projectId,
      userId: projectMembers.userId,
      email: projectMembers.email,
      role: projectMembers.role,
      color: projectMembers.color,
      invitedAt: projectMembers.invitedAt,
      joinedAt: projectMembers.joinedAt,
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
        avatarUrl: users.avatarUrl,
      },
    })
    .from(projectMembers)
    .leftJoin(users, eq(projectMembers.userId, users.id))
    .where(eq(projectMembers.projectId, projectId));

  return NextResponse.json(members);
}

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
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
  }

  const [existing] = await db
    .select()
    .from(projectMembers)
    .where(
      and(eq(projectMembers.projectId, projectId), eq(projectMembers.email, email))
    );

  if (existing) {
    return NextResponse.json(
      { error: "This person is already invited" },
      { status: 400 }
    );
  }

  const [{ value: memberCount }] = await db
    .select({ value: count() })
    .from(projectMembers)
    .where(eq(projectMembers.projectId, projectId));

  const invitedUser = await findOrCreateUser(email);

  const [member] = await db
    .insert(projectMembers)
    .values({
      projectId,
      email,
      role: "member",
      color: getNextColor(memberCount),
      invitedBy: auth.userId,
      userId: invitedUser.id,
      joinedAt: null,
    })
    .returning();

  const [project] = await db
    .select({ title: projects.title })
    .from(projects)
    .where(eq(projects.id, projectId));

  sendInviteEmail({
    to: email,
    inviterName: auth.session.user.name ?? "Someone",
    projectTitle: project?.title ?? "a project",
    projectUrl: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/project/${projectId}`,
  });

  return NextResponse.json(member);
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

  const body = await request.json();
  const memberId = typeof body.memberId === "string" ? body.memberId : "";

  if (!memberId) {
    return NextResponse.json({ error: "memberId is required" }, { status: 400 });
  }

  const [target] = await db
    .select()
    .from(projectMembers)
    .where(
      and(eq(projectMembers.id, memberId), eq(projectMembers.projectId, projectId))
    );

  if (!target || !target.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (typeof body.role === "string" && body.role === "owner") {
    if (auth.membership.role !== "owner") {
      return NextResponse.json({ error: "Only the owner can transfer ownership" }, { status: 403 });
    }
    await db.update(projectMembers)
      .set({ role: "owner" })
      .where(eq(projectMembers.id, memberId));
    await db.update(projectMembers)
      .set({ role: "member" })
      .where(eq(projectMembers.id, auth.membership.id));
    await db.update(projects)
      .set({ ownerId: target.userId })
      .where(eq(projects.id, projectId));
    return NextResponse.json({ success: true });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  await db.update(users).set({ name }).where(eq(users.id, target.userId));
  return NextResponse.json({ success: true });
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

  const body = await request.json();
  const memberId = typeof body.memberId === "string" ? body.memberId : "";

  if (!memberId) {
    return NextResponse.json({ error: "memberId is required" }, { status: 400 });
  }

  const [target] = await db
    .select()
    .from(projectMembers)
    .where(
      and(eq(projectMembers.id, memberId), eq(projectMembers.projectId, projectId))
    );

  if (!target) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (target.role === "owner") {
    return NextResponse.json(
      { error: "The owner cannot be removed" },
      { status: 400 }
    );
  }

  if (auth.membership.role !== "owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.delete(projectMembers).where(eq(projectMembers.id, memberId));

  return NextResponse.json({ success: true });
}

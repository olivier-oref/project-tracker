import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { projectMembers, projects, users } from "../../drizzle/schema";

export async function verifyProjectMembership(projectId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized", status: 401 } as const;

  const [membership] = await db
    .select()
    .from(projectMembers)
    .where(
      and(
        eq(projectMembers.projectId, projectId),
        eq(projectMembers.userId, session.user.id)
      )
    );

  if (!membership) return { error: "Forbidden", status: 403 } as const;

  return { session, membership, userId: session.user.id } as const;
}

/** Bumps the project's updatedAt so open boards refetch. Call only after a successful write. */
export async function touchProject(projectId: string) {
  await db.update(projects).set({ updatedAt: new Date() }).where(eq(projects.id, projectId));
}

/** Members of the project who have an account, with the name the board shows for them. */
export async function projectMemberNames(projectId: string) {
  const rows = await db
    .select({ id: projectMembers.userId, name: users.name, email: projectMembers.email })
    .from(projectMembers)
    .innerJoin(users, eq(users.id, projectMembers.userId))
    .where(eq(projectMembers.projectId, projectId));
  return rows.map((r) => ({ id: r.id as string, name: r.name ?? r.email.split("@")[0] }));
}

/** True when `phase` is null/empty or one of the project's phases. */
export async function isProjectPhase(projectId: string, phase: string | null) {
  if (!phase) return true;
  const [row] = await db.select({ phases: projects.phases }).from(projects).where(eq(projects.id, projectId));
  return Boolean(row?.phases.includes(phase));
}

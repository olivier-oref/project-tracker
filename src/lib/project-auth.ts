import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { projectMembers } from "../../drizzle/schema";

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

import { eq, sql, inArray } from "drizzle-orm";
import { auth, signOut } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  projects,
  projectMembers,
  sections,
  tasks,
} from "../../../drizzle/schema";
import { DashboardClient, type DashboardProject } from "@/components/dashboard/dashboard-client";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const memberProjects = await db
    .select({
      id: projects.id,
      title: projects.title,
      subtitle: projects.subtitle,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
      role: projectMembers.role,
      lastAccessedAt: projectMembers.lastAccessedAt,
    })
    .from(projects)
    .innerJoin(projectMembers, eq(projectMembers.projectId, projects.id))
    .where(eq(projectMembers.userId, userId))
    .orderBy(projects.createdAt);

  const projectIds = memberProjects.map((p) => p.id);

  const counts = projectIds.length
    ? await db
        .select({
          projectId: sections.projectId,
          total: sql<number>`count(*)`.mapWith(Number),
          done: sql<number>`count(*) filter (where ${tasks.status} = 'done')`.mapWith(
            Number
          ),
          inProgress: sql<number>`count(*) filter (where ${tasks.status} = 'in_progress')`.mapWith(
            Number
          ),
          blocked: sql<number>`count(*) filter (where ${tasks.status} = 'blocked')`.mapWith(
            Number
          ),
          unassigned: sql<number>`count(*) filter (where ${tasks.ownerId} is null)`.mapWith(
            Number
          ),
        })
        .from(tasks)
        .innerJoin(sections, eq(sections.id, tasks.sectionId))
        .where(inArray(sections.projectId, projectIds))
        .groupBy(sections.projectId)
    : [];

  const countsByProject = new Map(counts.map((c) => [c.projectId, c]));

  const ownedProjects: DashboardProject[] = [];
  const sharedProjects: DashboardProject[] = [];

  for (const p of memberProjects) {
    const c = countsByProject.get(p.id);
    const total = c?.total ?? 0;
    const done = c?.done ?? 0;
    const isOwner = p.role === "owner";

    const entry: DashboardProject = {
      id: p.id,
      title: p.title,
      subtitle: p.subtitle,
      total,
      done,
      inProgress: c?.inProgress ?? 0,
      blocked: c?.blocked ?? 0,
      unassigned: c?.unassigned ?? 0,
      completion: total > 0 ? Math.round((done / total) * 100) : 0,
      isOwner,
      createdAt: (p.createdAt ?? new Date(0)).toISOString(),
      updatedAt: (p.updatedAt ?? new Date(0)).toISOString(),
      lastAccessedAt: p.lastAccessedAt ? p.lastAccessedAt.toISOString() : null,
    };

    if (isOwner) {
      ownedProjects.push(entry);
    } else {
      sharedProjects.push(entry);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="h-[5px] bg-navy" />

      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-5">
        <h1 className="font-serif text-2xl text-navy">Project Tracker</h1>
        <div className="flex items-center gap-4 font-mono text-xs text-muted">
          <span>{session?.user?.name}</span>
          <form
            action={async () => {
              "use server";
              await signOut();
            }}
          >
            <button
              type="submit"
              className="uppercase tracking-wider text-rust hover:underline"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      <main className="flex-1 px-6 py-8">
        <DashboardClient ownedProjects={ownedProjects} sharedProjects={sharedProjects} />
      </main>
    </div>
  );
}

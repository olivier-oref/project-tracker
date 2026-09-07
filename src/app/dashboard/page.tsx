import { eq, sql, inArray } from "drizzle-orm";
import { auth, signOut } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  projects,
  projectMembers,
  sections,
  tasks,
} from "../../../drizzle/schema";
import { ProjectCard, type ProjectCardMetrics } from "@/components/dashboard/project-card";
import { CreateProjectForm } from "@/components/dashboard/create-project-form";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const memberProjects = await db
    .select({
      id: projects.id,
      title: projects.title,
      subtitle: projects.subtitle,
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

  const projectMetrics: ProjectCardMetrics[] = memberProjects.map((p) => {
    const c = countsByProject.get(p.id);
    const total = c?.total ?? 0;
    const done = c?.done ?? 0;
    return {
      id: p.id,
      title: p.title,
      subtitle: p.subtitle,
      total,
      done,
      inProgress: c?.inProgress ?? 0,
      blocked: c?.blocked ?? 0,
      unassigned: c?.unassigned ?? 0,
      completion: total > 0 ? Math.round((done / total) * 100) : 0,
    };
  });

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
        {projectMetrics.length === 0 ? (
          <div className="mx-auto max-w-md py-16 text-center">
            <p className="font-serif text-xl text-navy">No projects yet</p>
            <p className="mt-2 font-sans text-sm text-muted">
              Create your first project to get started.
            </p>
            <div className="mt-6">
              <CreateProjectForm />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {projectMetrics.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
            <CreateProjectForm />
          </div>
        )}
      </main>
    </div>
  );
}

import { eq, and, inArray } from "drizzle-orm";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  projects,
  projectMembers,
  sections,
  tasks,
  notes,
  users,
} from "../../../../drizzle/schema";
import { TrackerHeader } from "@/components/tracker/tracker-header";
import { SummaryStrip } from "@/components/tracker/summary-strip";
import { SectionBlock } from "@/components/tracker/section-block";
import type { MemberInfo } from "@/components/tracker/task-row";
import type { MemberOption } from "@/components/tracker/editable-owner";
import type { NoteData } from "@/components/tracker/note-thread";
import { AddSectionForm } from "@/components/tracker/add-section-form";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const session = await auth();
  const userId = session!.user!.id!;

  const [membership] = await db
    .select()
    .from(projectMembers)
    .where(
      and(
        eq(projectMembers.projectId, projectId),
        eq(projectMembers.userId, userId)
      )
    );

  if (!membership) return notFound();

  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId));

  if (!project) return notFound();

  const projectSections = await db
    .select()
    .from(sections)
    .where(eq(sections.projectId, projectId))
    .orderBy(sections.sortOrder);

  const sectionIds = projectSections.map((section) => section.id);

  const projectTasks = sectionIds.length
    ? await db
        .select()
        .from(tasks)
        .where(inArray(tasks.sectionId, sectionIds))
        .orderBy(tasks.sortOrder)
    : [];

  const taskIds = projectTasks.map((task) => task.id);

  const projectNotes = taskIds.length
    ? await db
        .select({
          id: notes.id,
          taskId: notes.taskId,
          content: notes.content,
          createdAt: notes.createdAt,
          authorId: notes.authorId,
          authorName: users.name,
        })
        .from(notes)
        .leftJoin(users, eq(users.id, notes.authorId))
        .where(inArray(notes.taskId, taskIds))
        .orderBy(notes.createdAt)
    : [];

  const members = await db
    .select({
      userId: projectMembers.userId,
      email: projectMembers.email,
      color: projectMembers.color,
      name: users.name,
    })
    .from(projectMembers)
    .leftJoin(users, eq(users.id, projectMembers.userId))
    .where(eq(projectMembers.projectId, projectId));

  const memberMap = new Map<string, MemberInfo>();
  const memberOptions: MemberOption[] = [];
  for (const member of members) {
    if (member.userId) {
      const info = { name: member.name ?? member.email, color: member.color };
      memberMap.set(member.userId, info);
      memberOptions.push({ id: member.userId, ...info });
    }
  }

  const notesByTask = new Map<string, NoteData[]>();
  for (const note of projectNotes) {
    const authorColor = note.authorId
      ? memberMap.get(note.authorId)?.color ?? null
      : null;
    const entry: NoteData = {
      id: note.id,
      content: note.content,
      createdAt: (note.createdAt ?? new Date()).toISOString(),
      authorName: note.authorName,
      authorColor,
    };
    const existing = notesByTask.get(note.taskId) ?? [];
    existing.push(entry);
    notesByTask.set(note.taskId, existing);
  }

  const tasksBySection = new Map<
    string,
    {
      id: string;
      title: string;
      status: string;
      dueDate: string | null;
      phase: string | null;
      ownerId: string | null;
    }[]
  >();
  for (const task of projectTasks) {
    const existing = tasksBySection.get(task.sectionId) ?? [];
    existing.push({
      id: task.id,
      title: task.title,
      status: task.status,
      dueDate: task.dueDate,
      phase: task.phase,
      ownerId: task.ownerId,
    });
    tasksBySection.set(task.sectionId, existing);
  }

  const total = projectTasks.length;
  const done = projectTasks.filter((task) => task.status === "done").length;
  const inProgress = projectTasks.filter(
    (task) => task.status === "in_progress"
  ).length;
  const blocked = projectTasks.filter(
    (task) => task.status === "blocked"
  ).length;
  const noDueDate = projectTasks.filter((task) => !task.dueDate).length;
  const completePercent = total > 0 ? Math.round((done / total) * 100) : 0;

  const dateString = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  return (
    <div className="min-h-screen">
      <div className="h-[5px] bg-navy" />

      <div className="mx-auto max-w-[1000px] px-7">
        <TrackerHeader
          subtitle={project.subtitle}
          title={project.title}
          date={dateString}
        />

        <SummaryStrip
          metrics={{
            total,
            done,
            inProgress,
            blocked,
            noDueDate,
            completePercent,
          }}
        />

        <div className="py-4">
          {projectSections.map((section, index) => (
            <SectionBlock
              key={section.id}
              projectId={projectId}
              section={section}
              index={index}
              tasks={tasksBySection.get(section.id) ?? []}
              notesByTask={notesByTask}
              members={memberOptions}
            />
          ))}
          <AddSectionForm projectId={projectId} />
        </div>

        <footer className="border-t border-line py-6 font-mono text-xs text-muted">
          Project Tracker
        </footer>
      </div>
    </div>
  );
}

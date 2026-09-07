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
import type { MemberInfo } from "@/components/tracker/task-row";
import type { MemberOption } from "@/components/tracker/editable-owner";
import type { NoteData } from "@/components/tracker/note-thread";
import { AddSectionForm } from "@/components/tracker/add-section-form";
import { ProjectToolbar, type FlatTaskData } from "@/components/tracker/project-toolbar";
import { MembersButton } from "@/components/members/members-button";
import type { MemberRow } from "@/components/members/members-panel";

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
      id: projectMembers.id,
      userId: projectMembers.userId,
      email: projectMembers.email,
      role: projectMembers.role,
      color: projectMembers.color,
      joinedAt: projectMembers.joinedAt,
      name: users.name,
      userEmail: users.email,
    })
    .from(projectMembers)
    .leftJoin(users, eq(users.id, projectMembers.userId))
    .where(eq(projectMembers.projectId, projectId));

  const memberMap = new Map<string, MemberInfo>();
  const memberOptions: MemberOption[] = [];
  const memberRows: MemberRow[] = [];
  for (const member of members) {
    const displayName = member.name ?? member.email.split("@")[0];
    if (member.userId) {
      const isPending = !member.joinedAt;
      const info = { name: displayName, color: member.color };
      memberMap.set(member.userId, info);
      memberOptions.push({ id: member.userId, name: isPending ? `${displayName} (pending)` : displayName, color: member.color });
    }
    memberRows.push({
      id: member.id,
      userId: member.userId,
      email: member.email,
      role: member.role,
      color: member.color,
      joinedAt: member.joinedAt ? member.joinedAt.toISOString() : null,
      user: member.userId
        ? { id: member.userId, name: member.name, email: member.userEmail ?? member.email }
        : null,
    });
  }

  const isOwner = membership.role === "owner";

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

  const allTasks: FlatTaskData[] = projectTasks.map((task) => ({
    id: task.id,
    title: task.title,
    status: task.status,
    dueDate: task.dueDate,
    phase: task.phase,
    ownerId: task.ownerId,
    sectionId: task.sectionId,
  }));

  const notesByTaskObj: Record<string, NoteData[]> = Object.fromEntries(notesByTask);

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

        <div className="flex justify-end gap-2 py-2">
          <MembersButton
            projectId={projectId}
            members={memberRows}
            isOwner={isOwner}
          />
        </div>

        <ProjectToolbar
          projectId={projectId}
          sections={projectSections.map((section) => ({
            id: section.id,
            title: section.title,
            sortOrder: section.sortOrder,
          }))}
          tasks={allTasks}
          notesByTask={notesByTaskObj}
          members={memberOptions}
        />

        <AddSectionForm projectId={projectId} />

        <footer className="border-t border-line py-6 font-mono text-xs text-muted">
          Project Tracker
        </footer>
      </div>
    </div>
  );
}

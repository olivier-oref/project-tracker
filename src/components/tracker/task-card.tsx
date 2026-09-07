"use client";

import type { ReactNode } from "react";
import { EditableStatus } from "@/components/tracker/editable-status";
import { EditableOwner, type MemberOption } from "@/components/tracker/editable-owner";
import { EditablePhase } from "@/components/tracker/editable-phase";
import { EditableDueDate } from "@/components/tracker/editable-due-date";
import { EditableTitle } from "@/components/tracker/editable-title";
import { DeleteTaskButton } from "@/components/tracker/delete-task-button";
import { NoteThread, type NoteData } from "@/components/tracker/note-thread";
import { AddNoteForm } from "@/components/tracker/add-note-form";
import type { TaskData } from "@/components/tracker/task-row";

export function TaskCard({
  projectId,
  task,
  notes,
  members,
  phaseSuggestions,
}: {
  projectId: string;
  task: TaskData;
  notes: NoteData[];
  members: MemberOption[];
  phaseSuggestions: string[];
}) {
  const isDone = task.status === "done";

  return (
    <div className="flex flex-col gap-3 border-b border-line px-3 py-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <EditableTitle
            projectId={projectId}
            taskId={task.id}
            title={task.title}
            isDone={isDone}
          />
        </div>
        <DeleteTaskButton projectId={projectId} taskId={task.id} />
      </div>

      <div className="flex flex-col gap-1.5 font-mono text-[9.5px] uppercase tracking-wide text-muted">
        <Field label="Status">
          <EditableStatus projectId={projectId} taskId={task.id} status={task.status} />
        </Field>
        <Field label="Owner">
          <EditableOwner
            projectId={projectId}
            taskId={task.id}
            ownerId={task.ownerId}
            members={members}
          />
        </Field>
        <Field label="Due">
          <EditableDueDate projectId={projectId} taskId={task.id} date={task.dueDate} />
        </Field>
        <Field label="Phase">
          <EditablePhase
            projectId={projectId}
            taskId={task.id}
            phase={task.phase}
            suggestions={phaseSuggestions}
          />
        </Field>
      </div>

      <NoteThread notes={notes} mobile={true} />
      <AddNoteForm projectId={projectId} taskId={task.id} />
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-14 shrink-0">{label}</span>
      {children}
    </div>
  );
}

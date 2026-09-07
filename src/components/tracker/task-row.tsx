"use client";

import { EditableStatus } from "@/components/tracker/editable-status";
import { EditableOwner, type MemberOption } from "@/components/tracker/editable-owner";
import { EditablePhase } from "@/components/tracker/editable-phase";
import { EditableDueDate } from "@/components/tracker/editable-due-date";
import { EditableTitle } from "@/components/tracker/editable-title";
import { DeleteTaskButton } from "@/components/tracker/delete-task-button";
import { NoteThread, type NoteData } from "@/components/tracker/note-thread";
import { AddNoteForm } from "@/components/tracker/add-note-form";

export type MemberInfo = { name: string; color: string };

export type TaskData = {
  id: string;
  title: string;
  status: string;
  dueDate: string | null;
  phase: string | null;
  ownerId: string | null;
};

export function TaskRow({
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
    <tr className="group hidden border-b border-line md:table-row">
      <td className="px-3 py-3 align-top">
        <EditableTitle
          projectId={projectId}
          taskId={task.id}
          title={task.title}
          isDone={isDone}
        />
        <NoteThread notes={notes} mobile={false} />
        <AddNoteForm projectId={projectId} taskId={task.id} />
      </td>
      <td className="px-3 py-3 align-top">
        <EditableStatus projectId={projectId} taskId={task.id} status={task.status} />
      </td>
      <td className="px-3 py-3 align-top">
        <EditableOwner
          projectId={projectId}
          taskId={task.id}
          ownerId={task.ownerId}
          members={members}
        />
      </td>
      <td className="px-3 py-3 align-top">
        <EditableDueDate projectId={projectId} taskId={task.id} date={task.dueDate} />
      </td>
      <td className="px-3 py-3 align-top">
        <EditablePhase
          projectId={projectId}
          taskId={task.id}
          phase={task.phase}
          suggestions={phaseSuggestions}
        />
      </td>
      <td className="w-11 px-1 py-3 align-top opacity-0 group-hover:opacity-100">
        <DeleteTaskButton projectId={projectId} taskId={task.id} />
      </td>
    </tr>
  );
}

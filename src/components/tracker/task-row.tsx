import { StatusBadge } from "@/components/tracker/status-badge";
import { OwnerBadge } from "@/components/tracker/owner-badge";
import { PhaseBadge } from "@/components/tracker/phase-badge";
import { DueDateBadge } from "@/components/tracker/due-date-badge";
import { NoteThread, type NoteData } from "@/components/tracker/note-thread";

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
  task,
  notes,
  members,
}: {
  task: TaskData;
  notes: NoteData[];
  members: Map<string, MemberInfo>;
}) {
  const owner = task.ownerId ? members.get(task.ownerId) ?? null : null;
  const isDone = task.status === "done";

  return (
    <tr className="hidden border-b border-line md:table-row">
      <td className="px-3 py-3 align-top">
        <p
          className={
            isDone
              ? "text-muted line-through decoration-line-2"
              : "text-ink"
          }
        >
          {task.title}
        </p>
        <NoteThread notes={notes} mobile={false} />
      </td>
      <td className="px-3 py-3 align-top">
        <StatusBadge status={task.status} />
      </td>
      <td className="px-3 py-3 align-top">
        <OwnerBadge name={owner?.name ?? null} color={owner?.color ?? null} />
      </td>
      <td className="px-3 py-3 align-top">
        <DueDateBadge date={task.dueDate} />
      </td>
      <td className="px-3 py-3 align-top">
        <PhaseBadge phase={task.phase} />
      </td>
    </tr>
  );
}

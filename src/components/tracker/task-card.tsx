import type { ReactNode } from "react";
import { StatusBadge } from "@/components/tracker/status-badge";
import { OwnerBadge } from "@/components/tracker/owner-badge";
import { PhaseBadge } from "@/components/tracker/phase-badge";
import { DueDateBadge } from "@/components/tracker/due-date-badge";
import { NoteThread, type NoteData } from "@/components/tracker/note-thread";
import type { MemberInfo, TaskData } from "@/components/tracker/task-row";

export function TaskCard({
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
    <div className="flex flex-col gap-3 border-b border-line px-3 py-4 md:hidden">
      <p
        className={
          isDone
            ? "text-muted line-through decoration-line-2"
            : "text-ink"
        }
      >
        {task.title}
      </p>

      <div className="flex flex-col gap-1.5 font-mono text-[9.5px] uppercase tracking-wide text-muted">
        <Field label="Status">
          <StatusBadge status={task.status} />
        </Field>
        <Field label="Owner">
          <OwnerBadge name={owner?.name ?? null} color={owner?.color ?? null} />
        </Field>
        <Field label="Due">
          <DueDateBadge date={task.dueDate} />
        </Field>
        {task.phase ? (
          <Field label="Phase">
            <PhaseBadge phase={task.phase} />
          </Field>
        ) : null}
      </div>

      <NoteThread notes={notes} mobile={true} />
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

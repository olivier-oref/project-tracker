"use client";

import { useRef } from "react";
import { NoteBlock, type MemberInfo, type NoteData } from "@/components/tracker/note-block";

export type FlatTask = {
  id: string;
  sectionId: string;
  title: string;
  status: string;
  ownerId: string | null;
  dueDate: string | null;
  phase: string | null;
};

const STATUS_TO_UI: Record<string, string> = {
  not_started: "open",
  in_progress: "progress",
  blocked: "blocked",
  done: "done",
};

const STATUS_TO_DB: Record<string, string> = {
  open: "not_started",
  progress: "in_progress",
  blocked: "blocked",
  done: "done",
};

const STATUS_OPTIONS = [
  { v: "open", label: "Not started" },
  { v: "progress", label: "In progress" },
  { v: "blocked", label: "Blocked" },
  { v: "done", label: "Done" },
];

const PHASE_LABELS: Record<string, string> = {
  remote: "Remote week",
  nyc: "NYC week",
  later: "Later",
};

function autoGrow(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = "auto";
  el.style.height = el.scrollHeight + "px";
}

function tint(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

export function TaskRowNew({
  projectId,
  task,
  notes,
  members,
  phases,
  topicName,
  onSave,
}: {
  projectId: string;
  task: FlatTask;
  notes: NoteData[];
  members: MemberInfo[];
  phases: string[];
  topicName?: string;
  onSave: () => void;
}) {
  const titleRef = useRef<HTMLTextAreaElement | null>(null);

  const done = task.status === "done";
  const uiStatus = STATUS_TO_UI[task.status] ?? "open";
  const owner = members.find((m) => m.id === task.ownerId);

  async function patchTask(body: Record<string, unknown>) {
    await fetch(`/api/projects/${projectId}/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    onSave();
  }

  async function deleteTask() {
    if (!confirm("Delete this task?")) return;
    await fetch(`/api/projects/${projectId}/tasks/${task.id}`, { method: "DELETE" });
    onSave();
  }

  function toggleTick() {
    patchTask({ status: done ? "not_started" : "done" });
  }

  function onStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    patchTask({ status: STATUS_TO_DB[e.target.value] ?? "not_started" });
  }

  function onTitleBlur(e: React.FocusEvent<HTMLTextAreaElement>) {
    patchTask({ title: e.target.value });
  }

  function onOwnerChange(e: React.ChangeEvent<HTMLInputElement>) {
    const name = e.target.value.trim();
    const match = members.find((m) => m.name.toLowerCase() === name.toLowerCase());
    const wrap = e.target.parentElement;
    if (wrap && match) {
      wrap.style.setProperty("--o", match.color);
      wrap.style.setProperty("--obg", tint(match.color, 0.14));
    } else if (wrap) {
      wrap.style.removeProperty("--o");
      wrap.style.removeProperty("--obg");
    }
  }

  function onOwnerBlur(e: React.FocusEvent<HTMLInputElement>) {
    const name = e.target.value.trim();
    const match = members.find((m) => m.name.toLowerCase() === name.toLowerCase());
    patchTask({ ownerId: match ? match.id : null });
  }

  function onDueChange(e: React.ChangeEvent<HTMLInputElement>) {
    patchTask({ dueDate: e.target.value || null });
  }

  function onPhaseChange(e: React.ChangeEvent<HTMLSelectElement>) {
    patchTask({ phase: e.target.value || null });
  }

  const ownerStyle = owner
    ? ({ "--o": owner.color, "--obg": tint(owner.color, 0.14) } as React.CSSProperties)
    : undefined;

  return (
    <div className={`task${done ? " done" : ""}`}>
      <button
        className="tick"
        data-on={done ? "1" : "0"}
        aria-label="Mark done"
        aria-pressed={done}
        onClick={toggleTick}
      />
      <div>
        <textarea
          className="task-title"
          rows={1}
          defaultValue={task.title}
          onInput={(e) => autoGrow(e.currentTarget)}
          onBlur={onTitleBlur}
          ref={(el) => {
            titleRef.current = el;
            autoGrow(el);
          }}
        />
        <NoteBlock projectId={projectId} taskId={task.id} notes={notes} members={members} onSave={onSave} />
        <div className="task-meta">
          {topicName ? <span className="flat-topic">{topicName}</span> : null}
          <select className="pill" data-v={uiStatus} defaultValue={uiStatus} onChange={onStatusChange}>
            {STATUS_OPTIONS.map((s) => (
              <option key={s.v} value={s.v}>
                {s.label}
              </option>
            ))}
          </select>
          <span className="owner-wrap" style={ownerStyle}>
            <span className="owner-dot" />
            <input
              className="owner"
              defaultValue={owner?.name ?? ""}
              placeholder="Unassigned"
              onChange={onOwnerChange}
              onBlur={onOwnerBlur}
            />
          </span>
          <input
            className={`due${task.dueDate ? "" : " nodate"}`}
            type="date"
            defaultValue={task.dueDate ?? ""}
            onChange={onDueChange}
          />
          <select className="pill phase" defaultValue={task.phase ?? ""} onChange={onPhaseChange}>
            <option value="">No phase</option>
            {phases.map((p) => (
              <option key={p} value={p}>
                {PHASE_LABELS[p] ?? p}
              </option>
            ))}
          </select>
        </div>
      </div>
      <button className="kill" aria-label="Delete task" onClick={deleteTask}>
        ×
      </button>
    </div>
  );
}

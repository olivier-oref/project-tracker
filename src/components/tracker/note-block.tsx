"use client";

import { useRef, useState } from "react";

export type MemberInfo = {
  id: string;
  name: string;
  color: string;
};

export type NoteData = {
  id: string;
  content: string;
  createdAt: string;
  authorName: string | null;
  authorColor: string | null;
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

function fmtStamp(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return `${d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}, ${d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`;
}

function NoteItem({
  note,
  older,
  projectId,
  taskId,
  onSave,
}: {
  note: NoteData;
  older: boolean;
  projectId: string;
  taskId: string;
  onSave: () => void;
}) {
  const style = note.authorColor
    ? ({ "--o": note.authorColor, "--obg": tint(note.authorColor, 0.14) } as React.CSSProperties)
    : undefined;

  async function saveContent(content: string) {
    await fetch(`/api/projects/${projectId}/notes/${note.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    onSave();
  }

  async function deleteNote() {
    if (!confirm("Delete this note?")) return;
    await fetch(`/api/projects/${projectId}/notes/${note.id}`, { method: "DELETE" });
    onSave();
  }

  return (
    <div className={`note-item${older ? " older" : ""}`} style={style}>
      <textarea
        className="note-text"
        rows={1}
        defaultValue={note.content}
        placeholder="Write a note"
        onInput={(e) => autoGrow(e.currentTarget)}
        onBlur={(e) => saveContent(e.currentTarget.value)}
        ref={autoGrow}
      />
      <div className="note-meta">
        <input className="note-author" value={note.authorName ?? ""} placeholder="Author" readOnly />
        <span className="note-date">{fmtStamp(note.createdAt)}</span>
        <button className="kill note-kill" aria-label="Delete note" onClick={deleteNote}>
          ×
        </button>
      </div>
    </div>
  );
}

export function NoteBlock({
  projectId,
  taskId,
  notes,
  onSave,
}: {
  projectId: string;
  taskId: string;
  notes: NoteData[];
  members: MemberInfo[];
  onSave: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const sorted = notes.slice().sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  const rest = sorted.length - 1;

  async function addNote() {
    await fetch(`/api/projects/${projectId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId, content: "" }),
    });
    onSave();
  }

  return (
    <div className="notes">
      {sorted.length > 0 && (
        <NoteItem note={sorted[0]} older={false} projectId={projectId} taskId={taskId} onSave={onSave} />
      )}
      {sorted.length > 1 && (
        <button
          className="note-toggle"
          aria-expanded={expanded}
          onClick={() => setExpanded((v) => !v)}
        >
          <span className="arrow">{expanded ? "▾" : "▸"}</span>
          {expanded ? "Hide" : "Show"} {rest} earlier note{rest > 1 ? "s" : ""}
        </button>
      )}
      {expanded &&
        sorted
          .slice(1)
          .map((n) => (
            <NoteItem key={n.id} note={n} older projectId={projectId} taskId={taskId} onSave={onSave} />
          ))}
      <button className="note-new" onClick={addNote}>
        + Note
      </button>
    </div>
  );
}

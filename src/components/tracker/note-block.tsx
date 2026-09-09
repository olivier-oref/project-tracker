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
  members,
  onSave,
}: {
  note: NoteData;
  older: boolean;
  projectId: string;
  taskId: string;
  members: MemberInfo[];
  onSave: () => void;
}) {
  const itemRef = useRef<HTMLDivElement>(null);

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

  async function saveAuthor(name: string) {
    const trimmed = name.trim();
    const match = members.find((m) => m.name.toLowerCase() === trimmed.toLowerCase());

    const body: Record<string, unknown> = {};
    if (match) {
      body.authorId = match.id;
      body.authorName = null;
    } else if (trimmed) {
      body.authorId = null;
      body.authorName = trimmed;
    } else {
      body.authorId = null;
      body.authorName = null;
    }

    const el = itemRef.current;
    if (el && match) {
      el.style.setProperty("--o", match.color);
      el.style.setProperty("--obg", tint(match.color, 0.14));
    } else if (el) {
      el.style.removeProperty("--o");
      el.style.removeProperty("--obg");
    }

    await fetch(`/api/projects/${projectId}/notes/${note.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    onSave();
  }

  async function deleteNote() {
    if (!confirm("Delete this note?")) return;
    await fetch(`/api/projects/${projectId}/notes/${note.id}`, { method: "DELETE" });
    onSave();
  }

  return (
    <div ref={itemRef} className={`note-item${older ? " older" : ""}`} style={style}>
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
        <input
          className="note-author"
          defaultValue={note.authorName ?? ""}
          placeholder="Author"
          style={note.authorColor ? { color: note.authorColor } : undefined}
          onBlur={(e) => saveAuthor(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); e.currentTarget.blur(); } }}
        />
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
  members,
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
        <NoteItem key={sorted[0].id} note={sorted[0]} older={false} projectId={projectId} taskId={taskId} members={members} onSave={onSave} />
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
            <NoteItem key={n.id} note={n} older projectId={projectId} taskId={taskId} members={members} onSave={onSave} />
          ))}
      <button className="note-new" onClick={addNote}>
        + Note
      </button>
    </div>
  );
}

"use client";

import { useState } from "react";

export type NoteData = {
  id: string;
  content: string;
  createdAt: string;
  authorName: string | null;
  authorColor: string | null;
};

export function NoteThread({
  notes,
  mobile,
}: {
  notes: NoteData[];
  mobile: boolean;
}) {
  const [open, setOpen] = useState(false);

  if (notes.length === 0) return null;

  if (mobile && !open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2 font-mono uppercase tracking-wide text-muted underline"
        style={{ fontSize: "9.5px" }}
      >
        {notes.length} {notes.length === 1 ? "note" : "notes"}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-1" style={{ marginTop: "6px" }}>
      {notes.map((note) => {
        const borderColor = note.authorColor ?? "var(--color-line)";
        const hasBg = !!note.authorColor;
        const formatted = new Intl.DateTimeFormat("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }).format(new Date(note.createdAt));

        return (
          <div
            key={note.id}
            className="rounded-r-sm text-ink"
            style={{
              fontSize: "12px",
              borderLeft: `2px solid ${borderColor}`,
              padding: "5px 8px",
              background: hasBg ? `${note.authorColor}24` : undefined,
            }}
          >
            <div>{note.content}</div>
            <div
              className="flex gap-2 font-mono text-muted"
              style={{ marginTop: "3px", fontSize: "9.5px", letterSpacing: "0.05em" }}
            >
              <b className="font-semibold" style={{ color: note.authorColor ?? "var(--color-muted)" }}>
                {note.authorName ?? "Unattributed"}
              </b>
              <span>{formatted}</span>
            </div>
          </div>
        );
      })}
      {mobile ? (
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="self-start font-mono uppercase tracking-wide text-muted underline"
          style={{ fontSize: "9.5px" }}
        >
          Hide notes
        </button>
      ) : null}
    </div>
  );
}

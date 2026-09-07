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
        className="mt-2 font-mono text-[9.5px] uppercase tracking-wide text-muted underline"
      >
        {notes.length} {notes.length === 1 ? "note" : "notes"}
      </button>
    );
  }

  return (
    <div className="mt-2 flex flex-col gap-2">
      {notes.map((note) => {
        const color = note.authorColor ?? "#DDD3BC";
        const formatted = new Intl.DateTimeFormat("en-US", {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        }).format(new Date(note.createdAt));

        return (
          <div
            key={note.id}
            className="py-[5px] pl-2 pr-2"
            style={{ borderLeft: `2px solid ${color}` }}
          >
            <p className="text-xs text-ink">{note.content}</p>
            <p className="mt-1 font-mono text-[9.5px]">
              <span className="font-bold" style={{ color }}>
                {note.authorName ?? "Unknown"}
              </span>{" "}
              <span className="text-muted">{formatted}</span>
            </p>
          </div>
        );
      })}
      {mobile ? (
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="self-start font-mono text-[9.5px] uppercase tracking-wide text-muted underline"
        >
          Hide notes
        </button>
      ) : null}
    </div>
  );
}

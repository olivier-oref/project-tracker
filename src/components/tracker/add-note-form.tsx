"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { apiPost } from "@/lib/api";

export function AddNoteForm({
  projectId,
  taskId,
}: {
  projectId: string;
  taskId: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [isPending, startTransition] = useTransition();

  async function handleSubmit() {
    const trimmed = value.trim();
    if (!trimmed) {
      setOpen(false);
      return;
    }
    await apiPost(`/api/projects/${projectId}/notes`, {
      taskId,
      content: trimmed,
    });
    setValue("");
    setOpen(false);
    startTransition(() => router.refresh());
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2 font-mono text-[9.5px] uppercase tracking-wide text-muted underline"
      >
        Add note
      </button>
    );
  }

  return (
    <div className="mt-2 flex flex-col gap-1" style={{ opacity: isPending ? 0.5 : 1 }}>
      <textarea
        autoFocus
        rows={2}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            handleSubmit();
          } else if (event.key === "Escape") {
            setValue("");
            setOpen(false);
          }
        }}
        className="w-full rounded border border-line bg-paper px-2 py-1 text-xs text-ink outline-none"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSubmit}
          className="flex h-11 items-center px-2 font-mono text-[9.5px] uppercase tracking-wide text-navy"
        >
          Save
        </button>
        <button
          type="button"
          onClick={() => {
            setValue("");
            setOpen(false);
          }}
          className="flex h-11 items-center px-2 font-mono text-[9.5px] uppercase tracking-wide text-muted"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

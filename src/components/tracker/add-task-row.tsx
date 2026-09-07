"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { apiPost } from "@/lib/api";

export function AddTaskRow({
  projectId,
  sectionId,
}: {
  projectId: string;
  sectionId: string;
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
    await apiPost(`/api/projects/${projectId}/tasks`, {
      sectionId,
      title: trimmed,
    });
    setValue("");
    startTransition(() => router.refresh());
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-h-11 w-full items-center gap-2 border border-dashed border-line-2 px-3 py-2 font-mono text-[10.5px] uppercase tracking-wide text-muted hover:text-navy"
      >
        + Add task
      </button>
    );
  }

  return (
    <div
      className="flex min-h-11 w-full items-center border border-dashed border-line-2 px-3 py-2"
      style={{ opacity: isPending ? 0.5 : 1 }}
    >
      <input
        autoFocus
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onBlur={() => {
          if (!value.trim()) setOpen(false);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            handleSubmit();
          } else if (event.key === "Escape") {
            setValue("");
            setOpen(false);
          }
        }}
        placeholder="Task title"
        className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted"
      />
    </div>
  );
}

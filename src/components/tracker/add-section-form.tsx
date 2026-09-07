"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { apiPost } from "@/lib/api";

export function AddSectionForm({ projectId }: { projectId: string }) {
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
    await apiPost(`/api/projects/${projectId}/sections`, { title: trimmed });
    setValue("");
    setOpen(false);
    startTransition(() => router.refresh());
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-h-11 items-center font-mono text-sm uppercase tracking-wide text-muted hover:text-navy"
      >
        + Add section
      </button>
    );
  }

  return (
    <div className="flex min-h-11 items-center gap-2" style={{ opacity: isPending ? 0.5 : 1 }}>
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
        placeholder="Section title"
        className="h-11 rounded border border-line bg-paper px-2 font-serif text-lg text-navy outline-none"
      />
    </div>
  );
}

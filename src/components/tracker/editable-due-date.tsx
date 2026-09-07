"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DueDateBadge } from "@/components/tracker/due-date-badge";
import { apiPatch } from "@/lib/api";

export function EditableDueDate({
  projectId,
  taskId,
  date,
}: {
  projectId: string;
  taskId: string;
  date: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  async function handleChange(newValue: string | null) {
    setOpen(false);
    await apiPatch(`/api/projects/${projectId}/tasks/${taskId}`, {
      dueDate: newValue,
    });
    startTransition(() => router.refresh());
  }

  return (
    <div className="relative inline-block" ref={ref} style={{ opacity: isPending ? 0.5 : 1 }}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="cursor-pointer"
      >
        <DueDateBadge date={date} />
      </button>
      {open ? (
        <div className="absolute left-0 top-full z-20 mt-1 flex min-h-11 items-center gap-2 rounded border border-line bg-paper p-2 shadow-lg">
          <input
            type="date"
            autoFocus
            defaultValue={date ? date.slice(0, 10) : ""}
            onChange={(event) => handleChange(event.target.value || null)}
            className="h-11 rounded border border-line bg-paper-2 px-2 font-mono text-[11px] text-ink"
          />
          <button
            type="button"
            onClick={() => handleChange(null)}
            className="flex h-11 items-center px-2 font-mono text-[10.5px] uppercase text-rust"
          >
            Clear
          </button>
        </div>
      ) : null}
    </div>
  );
}

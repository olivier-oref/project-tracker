"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/tracker/status-badge";
import { apiPatch } from "@/lib/api";

const OPTIONS = [
  { value: "not_started", label: "NOT STARTED" },
  { value: "in_progress", label: "IN PROGRESS" },
  { value: "blocked", label: "BLOCKED" },
  { value: "done", label: "DONE" },
];

export function EditableStatus({
  projectId,
  taskId,
  status,
}: {
  projectId: string;
  taskId: string;
  status: string;
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

  async function handleSelect(value: string) {
    setOpen(false);
    await apiPatch(`/api/projects/${projectId}/tasks/${taskId}`, {
      status: value,
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
        <StatusBadge status={status} />
      </button>
      {open ? (
        <div className="absolute left-0 top-full z-20 mt-1 min-w-[150px] rounded border border-line bg-paper shadow-lg">
          {OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option.value)}
              className="flex min-h-11 w-full items-center px-3 font-mono text-[10.5px] uppercase tracking-wide text-ink hover:bg-paper-2"
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

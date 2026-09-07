"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PhaseBadge } from "@/components/tracker/phase-badge";
import { apiPatch } from "@/lib/api";

export function EditablePhase({
  projectId,
  taskId,
  phase,
  suggestions,
}: {
  projectId: string;
  taskId: string;
  phase: string | null;
  suggestions: string[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(phase ?? "");
  const [isPending, startTransition] = useTransition();
  const listId = useId();

  async function commit() {
    setEditing(false);
    const trimmed = value.trim();
    if (trimmed === (phase ?? "")) return;
    await apiPatch(`/api/projects/${projectId}/tasks/${taskId}`, {
      phase: trimmed || null,
    });
    startTransition(() => router.refresh());
  }

  function cancel() {
    setValue(phase ?? "");
    setEditing(false);
  }

  if (editing) {
    return (
      <>
        <input
          autoFocus
          list={listId}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              commit();
            } else if (event.key === "Escape") {
              cancel();
            }
          }}
          className="h-11 w-full rounded border border-line bg-paper px-2 font-mono text-[10.5px] text-navy outline-none"
          style={{ opacity: isPending ? 0.5 : 1 }}
        />
        <datalist id={listId}>
          {suggestions.map((suggestion) => (
            <option key={suggestion} value={suggestion} />
          ))}
        </datalist>
      </>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="cursor-pointer"
      style={{ opacity: isPending ? 0.5 : 1 }}
    >
      {phase ? <PhaseBadge phase={phase} /> : (
        <span className="font-mono text-[10.5px] italic text-muted">+ phase</span>
      )}
    </button>
  );
}

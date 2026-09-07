"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { apiPatch } from "@/lib/api";

export function EditableTitle({
  projectId,
  taskId,
  title,
  isDone,
}: {
  projectId: string;
  taskId: string;
  title: string;
  isDone: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(title);
  const [isPending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  async function commit() {
    setEditing(false);
    const trimmed = value.trim();
    if (!trimmed || trimmed === title) {
      setValue(title);
      return;
    }
    await apiPatch(`/api/projects/${projectId}/tasks/${taskId}`, {
      title: trimmed,
    });
    startTransition(() => router.refresh());
  }

  function cancel() {
    setValue(title);
    setEditing(false);
  }

  if (editing) {
    return (
      <textarea
        ref={textareaRef}
        autoFocus
        rows={1}
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
          const el = textareaRef.current;
          if (el) {
            el.style.height = "auto";
            el.style.height = `${el.scrollHeight}px`;
          }
        }}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            commit();
          } else if (event.key === "Escape") {
            cancel();
          }
        }}
        className="w-full resize-none overflow-hidden rounded border border-line bg-paper px-1 py-0.5 text-ink outline-none"
        style={{ opacity: isPending ? 0.5 : 1 }}
      />
    );
  }

  return (
    <p
      onClick={() => setEditing(true)}
      className={
        "cursor-text " +
        (isDone ? "text-muted line-through decoration-line-2" : "text-ink")
      }
      style={{ opacity: isPending ? 0.5 : 1 }}
    >
      {title}
    </p>
  );
}

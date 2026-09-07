"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { apiPatch } from "@/lib/api";

export function EditableSectionTitle({
  projectId,
  sectionId,
  title,
}: {
  projectId: string;
  sectionId: string;
  title: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(title);
  const [isPending, startTransition] = useTransition();

  async function commit() {
    setEditing(false);
    const trimmed = value.trim();
    if (!trimmed || trimmed === title) {
      setValue(title);
      return;
    }
    await apiPatch(`/api/projects/${projectId}/sections/${sectionId}`, {
      title: trimmed,
    });
    startTransition(() => router.refresh());
  }

  if (editing) {
    return (
      <input
        autoFocus
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commit();
          } else if (event.key === "Escape") {
            setValue(title);
            setEditing(false);
          }
        }}
        className="h-9 rounded border border-line bg-paper px-2 font-serif text-xl text-navy outline-none"
        style={{ opacity: isPending ? 0.5 : 1 }}
      />
    );
  }

  return (
    <h2
      onClick={() => setEditing(true)}
      className="flex-1 cursor-text font-serif text-[20px] font-semibold text-navy"
      style={{ opacity: isPending ? 0.5 : 1 }}
    >
      {title}
    </h2>
  );
}

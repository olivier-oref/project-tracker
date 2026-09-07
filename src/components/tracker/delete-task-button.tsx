"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { apiDelete } from "@/lib/api";

export function DeleteTaskButton({
  projectId,
  taskId,
  className,
}: {
  projectId: string;
  taskId: string;
  className?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function handleDelete() {
    if (!window.confirm("Delete this task?")) return;
    await apiDelete(`/api/projects/${projectId}/tasks/${taskId}`);
    startTransition(() => router.refresh());
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      aria-label="Delete task"
      className={
        "flex h-11 w-11 items-center justify-center text-muted hover:text-rust " +
        (className ?? "")
      }
      style={{ opacity: isPending ? 0.5 : 1 }}
    >
      ×
    </button>
  );
}

"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { OwnerBadge } from "@/components/tracker/owner-badge";
import { apiPatch } from "@/lib/api";

export type MemberOption = { id: string; name: string; color: string };

export function EditableOwner({
  projectId,
  taskId,
  ownerId,
  members,
}: {
  projectId: string;
  taskId: string;
  ownerId: string | null;
  members: MemberOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  const owner = ownerId ? members.find((member) => member.id === ownerId) ?? null : null;

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

  async function handleSelect(value: string | null) {
    setOpen(false);
    await apiPatch(`/api/projects/${projectId}/tasks/${taskId}`, {
      ownerId: value,
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
        <OwnerBadge name={owner?.name ?? null} color={owner?.color ?? null} />
      </button>
      {open ? (
        <div className="absolute left-0 top-full z-20 mt-1 min-w-[150px] rounded border border-line bg-paper shadow-lg">
          <button
            type="button"
            onClick={() => handleSelect(null)}
            className="flex min-h-11 w-full items-center px-3 font-mono text-[11px] italic text-muted hover:bg-paper-2"
          >
            Unassigned
          </button>
          {members.map((member) => (
            <button
              key={member.id}
              type="button"
              onClick={() => handleSelect(member.id)}
              className="flex min-h-11 w-full items-center px-3 font-mono text-[11px] text-ink hover:bg-paper-2"
              style={{ color: member.color }}
            >
              {member.name}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

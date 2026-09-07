"use client";

import { useState } from "react";
import { MembersPanel, type MemberRow } from "@/components/members/members-panel";

export function MembersButton({
  projectId,
  members,
  isOwner,
}: {
  projectId: string;
  members: MemberRow[];
  isOwner: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-11 items-center rounded border border-line px-3 font-mono text-xs uppercase tracking-wide text-ink"
      >
        Members ({members.length})
      </button>
      <MembersPanel
        projectId={projectId}
        members={members}
        isOwner={isOwner}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

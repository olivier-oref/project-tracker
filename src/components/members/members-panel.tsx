"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { InviteForm } from "@/components/members/invite-form";

export type MemberRow = {
  id: string;
  userId: string | null;
  email: string;
  role: string;
  color: string;
  joinedAt: string | null;
  user: { id: string; name: string | null; email: string } | null;
};

export function MembersPanel({
  projectId,
  members,
  isOwner,
  open,
  onClose,
}: {
  projectId: string;
  members: MemberRow[];
  isOwner: boolean;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [removingId, setRemovingId] = useState<string | null>(null);

  function handleRemove(memberId: string) {
    setRemovingId(memberId);
    startTransition(async () => {
      await fetch(`/api/projects/${projectId}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId }),
      });
      router.refresh();
      setRemovingId(null);
    });
  }

  function handleTransferOwnership(memberId: string, memberName: string) {
    if (!confirm(`Transfer project ownership to ${memberName}? You will become a regular member.`)) return;
    startTransition(async () => {
      await fetch(`/api/projects/${projectId}/members`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, role: "owner" }),
      });
      router.refresh();
    });
  }

  function handleRename(memberId: string, name: string) {
    if (!name.trim()) return;
    startTransition(async () => {
      await fetch(`/api/projects/${projectId}/members`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, name: name.trim() }),
      });
      router.refresh();
    });
  }

  return (
    <>
      {open ? (
        <div
          className="fixed inset-0 z-40 bg-navy/40"
          onClick={onClose}
        />
      ) : null}
      <aside
        className={`fixed right-0 top-0 z-50 h-full w-full max-w-[320px] transform border-l border-line bg-paper shadow-lg transition-transform duration-200 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-14 items-center justify-between border-b border-line px-4">
          <h2 className="font-serif text-lg text-navy">Members</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center font-mono text-lg text-muted"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="flex flex-col gap-3 overflow-y-auto p-4">
          {members.map((member) => {
            const isPendingInvite = !member.joinedAt;
            const displayName = member.user?.name ?? member.email.split("@")[0];
            const canRemove = isOwner && member.role !== "owner";

            return (
              <div
                key={member.id}
                className="flex items-center gap-3 border-b border-line-2 pb-3"
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: member.color }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <input
                      className="truncate border-0 border-b border-transparent bg-transparent font-sans text-sm text-ink outline-none hover:border-line-2 focus:border-gold"
                      defaultValue={displayName}
                      placeholder="Enter name"
                      style={{ width: "100%", padding: "2px 0" }}
                      onBlur={(e) => handleRename(member.id, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          e.currentTarget.blur();
                        }
                      }}
                    />
                    {member.role === "owner" ? (
                      <span className="shrink-0 font-mono text-[10px] uppercase tracking-wide text-navy">
                        Owner
                      </span>
                    ) : null}
                    {isPendingInvite ? (
                      <span className="shrink-0 rounded-[2px] bg-gold/20 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-gold">
                        Pending
                      </span>
                    ) : null}
                  </div>
                  <p className="truncate font-mono text-xs text-muted">
                    {member.email}
                  </p>
                </div>
                {isOwner && member.role !== "owner" && member.joinedAt ? (
                  <button
                    type="button"
                    onClick={() => handleTransferOwnership(member.id, displayName)}
                    className="shrink-0 rounded-[2px] border border-line px-2 py-1 font-mono text-[10px] uppercase tracking-wide text-navy hover:bg-paper-3"
                  >
                    Make owner
                  </button>
                ) : null}
                {canRemove ? (
                  <button
                    type="button"
                    onClick={() => handleRemove(member.id)}
                    disabled={isPending && removingId === member.id}
                    aria-label={`Remove ${displayName}`}
                    className="flex h-11 w-11 shrink-0 items-center justify-center font-mono text-sm text-muted hover:text-rust disabled:opacity-50"
                  >
                    ×
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="border-t border-line p-4">
          <ProjectInviteLink projectId={projectId} />
        </div>

        {isOwner ? (
          <div className="border-t border-line p-4">
            <InviteForm projectId={projectId} />
          </div>
        ) : null}
      </aside>
    </>
  );
}

function ProjectInviteLink({ projectId }: { projectId: string }) {
  const [copied, setCopied] = useState(false);

  const link = typeof window !== "undefined"
    ? `${window.location.origin}/project/${projectId}`
    : `/project/${projectId}`;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      const input = document.createElement("input");
      input.value = link;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [link]);

  return (
    <div className="flex flex-col gap-2">
      <p className="font-mono text-[10px] uppercase tracking-wide text-gold">
        Project link
      </p>
      <div className="flex gap-2">
        <input
          readOnly
          value={link}
          className="h-9 flex-1 min-w-0 rounded border border-line bg-paper-2 px-2 font-mono text-[10px] text-muted outline-none"
        />
        <button
          type="button"
          onClick={handleCopy}
          className="h-9 shrink-0 rounded border border-line px-3 font-mono text-[10px] uppercase tracking-wide text-navy hover:bg-paper-3"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <p className="font-mono text-[10px] text-muted">
        Add members by email above, then share this link. They sign in and land directly in the project.
      </p>
    </div>
  );
}

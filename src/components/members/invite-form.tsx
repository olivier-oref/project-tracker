"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { apiPost } from "@/lib/api";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function InviteForm({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setInviteLink(null);
    setCopied(false);

    const trimmed = email.trim().toLowerCase();
    if (!EMAIL_RE.test(trimmed)) {
      setError("Enter a valid email address");
      return;
    }

    startTransition(async () => {
      try {
        await apiPost(`/api/projects/${projectId}/members`, { email: trimmed });
        const link = `${window.location.origin}/project/${projectId}`;
        setInviteLink(link);
        setEmail("");
        router.refresh();
      } catch {
        setError("This person is already invited");
      }
    });
  }

  async function handleCopy() {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement("input");
      input.value = inviteLink;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setError(null);
            setInviteLink(null);
          }}
          placeholder="email@example.com"
          disabled={isPending}
          className="h-11 flex-1 min-w-0 rounded border border-line bg-paper px-3 font-mono text-xs text-ink outline-none focus:border-navy"
        />
        <button
          type="submit"
          disabled={isPending}
          className="h-11 shrink-0 rounded bg-navy px-4 font-mono text-xs uppercase tracking-wide text-paper disabled:opacity-50"
        >
          Invite
        </button>
      </form>
      {error ? <p className="font-mono text-xs text-rust">{error}</p> : null}
      {inviteLink ? (
        <div className="flex flex-col gap-1.5">
          <p className="font-mono text-xs text-green">Member added</p>
          <div className="flex gap-2">
            <input
              readOnly
              value={inviteLink}
              className="h-9 flex-1 min-w-0 rounded border border-line bg-paper-2 px-2 font-mono text-[10px] text-muted outline-none"
            />
            <button
              type="button"
              onClick={handleCopy}
              className="h-9 shrink-0 rounded border border-line px-3 font-mono text-[10px] uppercase tracking-wide text-navy hover:bg-paper-3"
            >
              {copied ? "Copied" : "Copy link"}
            </button>
          </div>
          <p className="font-mono text-[10px] text-muted">
            Share this link — they sign in with Google or email/password
          </p>
        </div>
      ) : null}
    </div>
  );
}

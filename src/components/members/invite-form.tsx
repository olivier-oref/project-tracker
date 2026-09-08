"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { apiPost } from "@/lib/api";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function InviteForm({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    const trimmed = email.trim().toLowerCase();
    if (!EMAIL_RE.test(trimmed)) {
      setError("Enter a valid email address");
      return;
    }

    startTransition(async () => {
      try {
        await apiPost(`/api/projects/${projectId}/members`, { email: trimmed });
        setEmail("");
        setSuccess(true);
        router.refresh();
        setTimeout(() => setSuccess(false), 3000);
      } catch {
        setError("This person is already invited");
      }
    });
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
            setSuccess(false);
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
      {success ? <p className="font-mono text-xs text-green">Member added — share the project link above</p> : null}
    </div>
  );
}

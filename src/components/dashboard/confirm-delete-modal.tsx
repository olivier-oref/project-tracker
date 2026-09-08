"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ConfirmDeleteModal({
  title,
  projectId,
  action,
  open,
  onClose,
}: {
  title: string;
  projectId: string;
  action: "delete" | "leave";
  open: boolean;
  onClose: () => void;
}) {
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  if (!open) return null;

  const matches = value === title;

  async function handleConfirm() {
    if (!matches || submitting) return;
    setSubmitting(true);
    setError(null);

    const res = await fetch(`/api/projects/${projectId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(action === "leave" ? { action: "leave" } : {}),
    });

    setSubmitting(false);

    if (!res.ok) {
      setError("Something went wrong");
      return;
    }

    router.refresh();
    onClose();
  }

  function handleClose() {
    setValue("");
    setError(null);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 px-4">
      <div className="w-full max-w-sm rounded-lg border border-line bg-paper p-6">
        <h2 className="font-serif text-lg text-navy">
          {action === "delete" ? "Delete project" : "Leave project"}
        </h2>
        <p className="mt-2 font-sans text-sm text-muted">
          Type <span className="font-semibold text-ink">{title}</span> to confirm.
        </p>

        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="mt-4 min-h-[44px] w-full rounded border border-line bg-paper-2 px-3 font-sans text-ink outline-none focus:border-navy"
          placeholder={title}
        />

        {error ? <p className="mt-2 font-mono text-xs text-rust">{error}</p> : null}

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!matches || submitting}
            className="min-h-[44px] flex-1 rounded bg-rust px-4 font-mono text-xs uppercase tracking-wider text-paper disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? "Working…" : action === "delete" ? "Delete" : "Leave"}
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="min-h-[44px] rounded border border-line px-4 font-mono text-xs uppercase tracking-wider text-muted"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

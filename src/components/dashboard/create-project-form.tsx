"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CreateProjectForm() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-h-[160px] flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-line-2 text-muted transition-colors hover:border-navy hover:text-navy"
      >
        <span className="font-serif text-3xl leading-none">+</span>
        <span className="font-mono text-xs uppercase tracking-wider">
          New Project
        </span>
      </button>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, subtitle }),
    });

    setSubmitting(false);

    if (!res.ok) {
      setError("Failed to create project");
      return;
    }

    setTitle("");
    setSubtitle("");
    setOpen(false);
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-lg border border-navy bg-paper-2 p-5"
    >
      <div className="flex flex-col gap-1">
        <label className="font-mono text-xs uppercase tracking-wider text-muted">
          Title
        </label>
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="min-h-[44px] rounded border border-line bg-paper px-3 font-sans text-ink outline-none focus:border-navy"
          placeholder="Project title"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="font-mono text-xs uppercase tracking-wider text-muted">
          Subtitle
        </label>
        <input
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          className="min-h-[44px] rounded border border-line bg-paper px-3 font-sans text-ink outline-none focus:border-navy"
          placeholder="Optional subtitle"
        />
      </div>

      {error ? <p className="font-mono text-xs text-rust">{error}</p> : null}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="min-h-[44px] flex-1 rounded bg-navy px-4 font-mono text-xs uppercase tracking-wider text-paper disabled:opacity-50"
        >
          {submitting ? "Creating…" : "Create"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="min-h-[44px] rounded border border-line px-4 font-mono text-xs uppercase tracking-wider text-muted"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

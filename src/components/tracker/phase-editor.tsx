"use client";

import { useState } from "react";

type Row = { orig: string | null; name: string };

/**
 * "Edit phases" panel under the board title: add, rename, reorder and delete the project's phases.
 * Edits stay local until Save, and stay on screen if the save fails (nothing typed is lost).
 */
export function PhaseEditor({
  projectId,
  phases,
  taskCounts,
  onSave,
}: {
  projectId: string;
  phases: string[];
  taskCounts: Record<string, number>;
  onSave: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function start() {
    setRows(phases.map((p) => ({ orig: p, name: p })));
    setNewName("");
    setError("");
    setOpen(true);
  }

  function move(i: number, delta: number) {
    const j = i + delta;
    if (j < 0 || j >= rows.length) return;
    const next = rows.slice();
    [next[i], next[j]] = [next[j], next[i]];
    setRows(next);
  }

  function add() {
    const name = newName.trim();
    if (!name) return;
    setRows([...rows, { orig: null, name }]);
    setNewName("");
  }

  async function save() {
    const kept = new Set(rows.map((r) => r.orig).filter(Boolean));
    const removed = phases.filter((p) => !kept.has(p));
    const affected = removed.reduce((n, p) => n + (taskCounts[p] ?? 0), 0);
    if (affected && !confirm(`${removed.join(", ")}: ${affected} task${affected > 1 ? "s" : ""} will lose ${removed.length > 1 ? "their phase" : "this phase"}. Continue?`)) {
      return;
    }
    const renames: Record<string, string> = {};
    for (const r of rows) if (r.orig && r.orig !== r.name.trim()) renames[r.orig] = r.name.trim();

    setSaving(true);
    setError("");
    const res = await fetch(`/api/projects/${projectId}/phases`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phases: rows.map((r) => r.name), renames, expected: phases }),
    }).catch(() => null);
    setSaving(false);
    if (!res?.ok) {
      const body = await res?.json().catch(() => null);
      setError(body?.error ?? "Couldn't save phases. Check your connection and try again.");
      return;
    }
    setOpen(false);
    onSave();
  }

  if (!open) {
    return (
      <button type="button" className="btn mini" onClick={start}>
        {phases.length ? "Edit phases" : "Add phases"}
      </button>
    );
  }

  return (
    <div className="phase-editor" role="group" aria-label="Edit phases">
      {rows.length === 0 ? <p className="phase-empty">No phases yet. Add the first one below.</p> : null}
      <ol>
        {rows.map((row, i) => (
          <li key={row.orig ?? `new-${i}`}>
            <span className="phase-n">Phase {i + 1}</span>
            <input
              aria-label={`Phase ${i + 1} name`}
              value={row.name}
              maxLength={40}
              onChange={(e) => setRows(rows.map((r, k) => (k === i ? { ...r, name: e.target.value } : r)))}
            />
            <button type="button" className="btn mini" aria-label={`Move ${row.name} up`} disabled={i === 0} onClick={() => move(i, -1)}>
              ↑
            </button>
            <button type="button" className="btn mini" aria-label={`Move ${row.name} down`} disabled={i === rows.length - 1} onClick={() => move(i, 1)}>
              ↓
            </button>
            <button type="button" className="kill" aria-label={`Delete ${row.name}`} onClick={() => setRows(rows.filter((_, k) => k !== i))}>
              ×
            </button>
          </li>
        ))}
      </ol>
      <div className="phase-add">
        <input
          aria-label="New phase name"
          placeholder="New phase"
          value={newName}
          maxLength={40}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <button type="button" className="btn mini" onClick={add}>
          Add
        </button>
      </div>
      {error ? <p className="phase-error" role="alert">{error}</p> : null}
      <div className="phase-actions">
        <button type="button" className="btn primary" onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save phases"}
        </button>
        <button type="button" className="btn" onClick={() => setOpen(false)} disabled={saving}>
          Cancel
        </button>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ConfirmDeleteModal } from "./confirm-delete-modal";

export type ProjectCardMetrics = {
  id: string;
  title: string;
  subtitle: string | null;
  total: number;
  done: number;
  inProgress: number;
  blocked: number;
  unassigned: number;
  completion: number;
  isOwner: boolean;
};

export function ProjectCard({ project }: { project: ProjectCardMetrics }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(project.title);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  return (
    <div className="group relative flex flex-col gap-4 rounded-lg border border-line bg-paper-2 p-5 transition-colors hover:border-navy">
      <div ref={menuRef} className="absolute right-3 top-3">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            setMenuOpen((v) => !v);
          }}
          aria-label="Project actions"
          className="flex h-11 w-11 items-center justify-center rounded-full text-lg text-muted hover:bg-paper-3 hover:text-navy"
        >
          ⋯
        </button>

        {menuOpen ? (
          <div className="absolute right-0 top-full z-10 mt-1 min-w-[160px] overflow-hidden rounded-lg border border-line bg-paper shadow-lg">
            {project.isOwner ? (
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  setRenaming(true);
                }}
                className="min-h-[44px] w-full px-4 text-left font-mono text-xs uppercase tracking-wider text-ink hover:bg-paper-3"
              >
                Rename
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                setModalOpen(true);
              }}
              className="min-h-[44px] w-full px-4 text-left font-mono text-xs uppercase tracking-wider text-rust hover:bg-paper-3"
            >
              {project.isOwner ? "Delete project" : "Leave project"}
            </button>
          </div>
        ) : null}
      </div>

      {renaming ? (
        <div className="flex gap-2 pr-14">
          <input
            autoFocus
            className="flex-1 rounded border border-line bg-paper px-2 py-1 font-serif text-xl text-navy outline-none focus:border-gold"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={async (e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                const trimmed = renameValue.trim();
                if (trimmed && trimmed !== project.title) {
                  await fetch(`/api/projects/${project.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ title: trimmed }),
                  });
                  router.refresh();
                }
                setRenaming(false);
              } else if (e.key === "Escape") {
                setRenameValue(project.title);
                setRenaming(false);
              }
            }}
            onBlur={async () => {
              const trimmed = renameValue.trim();
              if (trimmed && trimmed !== project.title) {
                await fetch(`/api/projects/${project.id}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ title: trimmed }),
                });
                router.refresh();
              }
              setRenaming(false);
            }}
          />
        </div>
      ) : null}

      <Link href={`/project/${project.id}`} className={`flex flex-col gap-4${renaming ? " pointer-events-none" : ""}`}>
        <div>
          <h2 className="font-serif text-xl text-navy pr-8">{renaming ? renameValue : project.title}</h2>
          {project.subtitle ? (
            <p className="mt-1 font-mono text-xs uppercase tracking-wider text-gold">
              {project.subtitle}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-4 font-mono text-xs text-muted">
          <Metric label="Total" value={project.total} />
          <Metric label="Done" value={project.done} />
          <Metric label="In Progress" value={project.inProgress} />
          <Metric label="Blocked" value={project.blocked} />
          <Metric label="Unassigned" value={project.unassigned} />
        </div>

        <div className="flex items-center gap-2">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-paper-3">
            <div
              className="h-full rounded-full bg-green"
              style={{ width: `${project.completion}%` }}
            />
          </div>
          <span className="font-mono text-xs text-muted">
            {project.completion}%
          </span>
        </div>
      </Link>

      <ConfirmDeleteModal
        title={project.title}
        projectId={project.id}
        action={project.isOwner ? "delete" : "leave"}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col">
      <span className="text-ink">{value}</span>
      <span className="uppercase tracking-wider text-[10px]">{label}</span>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ProjectCard, type ProjectCardMetrics } from "./project-card";
import { CreateProjectForm } from "./create-project-form";

export type DashboardProject = ProjectCardMetrics & {
  createdAt: string;
  updatedAt: string;
  lastAccessedAt: string | null;
};

type SortKey = "lastAccessed" | "lastUpdated" | "created";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "lastAccessed", label: "Last accessed" },
  { key: "lastUpdated", label: "Last updated" },
  { key: "created", label: "Created" },
];

const PAGE_SIZE = 5;

function sortProjects(list: DashboardProject[], sort: SortKey): DashboardProject[] {
  const copy = [...list];
  if (sort === "lastAccessed") {
    copy.sort((a, b) => {
      if (!a.lastAccessedAt && !b.lastAccessedAt) return 0;
      if (!a.lastAccessedAt) return 1;
      if (!b.lastAccessedAt) return -1;
      return b.lastAccessedAt.localeCompare(a.lastAccessedAt);
    });
  } else if (sort === "lastUpdated") {
    copy.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  } else {
    copy.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  return copy;
}

export function DashboardClient({
  ownedProjects,
  sharedProjects,
}: {
  ownedProjects: DashboardProject[];
  sharedProjects: DashboardProject[];
}) {
  const [sort, setSort] = useState<SortKey>("lastAccessed");
  const [showAllOwned, setShowAllOwned] = useState(false);
  const [showAllShared, setShowAllShared] = useState(false);
  const router = useRouter();

  useEffect(() => {
    function onVisibility() {
      if (document.visibilityState === "visible") router.refresh();
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [router]);

  const sortedOwned = useMemo(() => sortProjects(ownedProjects, sort), [ownedProjects, sort]);
  const sortedShared = useMemo(() => sortProjects(sharedProjects, sort), [sharedProjects, sort]);

  return (
    <div className="flex flex-col gap-10">
      <div
        className="inline-flex w-fit overflow-hidden rounded border border-line-2"
        role="group"
        aria-label="Sort projects"
      >
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            type="button"
            aria-pressed={sort === opt.key}
            onClick={() => setSort(opt.key)}
            className={`min-h-[44px] border-r border-line-2 px-4 font-mono text-xs uppercase tracking-wider last:border-r-0 ${
              sort === opt.key ? "bg-navy text-paper" : "bg-transparent text-muted hover:text-navy"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <ProjectSection
        title="My Projects"
        projects={sortedOwned}
        showAll={showAllOwned}
        onToggle={() => setShowAllOwned((v) => !v)}
        emptyLabel="No projects yet"
        showCreate
      />

      <ProjectSection
        title="Shared with me"
        projects={sortedShared}
        showAll={showAllShared}
        onToggle={() => setShowAllShared((v) => !v)}
        emptyLabel="No shared projects yet"
      />
    </div>
  );
}

function ProjectSection({
  title,
  projects,
  showAll,
  onToggle,
  emptyLabel,
  showCreate = false,
}: {
  title: string;
  projects: DashboardProject[];
  showAll: boolean;
  onToggle: () => void;
  emptyLabel: string;
  showCreate?: boolean;
}) {
  const visible = showAll ? projects : projects.slice(0, PAGE_SIZE);
  const remaining = projects.length - PAGE_SIZE;

  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-serif text-lg text-navy">{title}</h2>

      {projects.length === 0 && !showCreate ? (
        <p className="font-sans text-sm italic text-muted">{emptyLabel}</p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
          {showCreate ? <CreateProjectForm /> : null}
        </div>
      )}

      {remaining > 0 ? (
        <button
          type="button"
          onClick={onToggle}
          className="min-h-[44px] w-fit font-mono text-xs uppercase tracking-wider text-navy underline underline-offset-4"
        >
          {showAll ? "Show less" : `Show ${remaining} more`}
        </button>
      ) : null}
    </section>
  );
}

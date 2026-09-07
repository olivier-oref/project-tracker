"use client";

import Link from "next/link";

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
};

export function ProjectCard({ project }: { project: ProjectCardMetrics }) {
  return (
    <Link
      href={`/project/${project.id}`}
      className="flex flex-col gap-4 rounded-lg border border-line bg-paper-2 p-5 transition-colors hover:border-navy"
    >
      <div>
        <h2 className="font-serif text-xl text-navy">{project.title}</h2>
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

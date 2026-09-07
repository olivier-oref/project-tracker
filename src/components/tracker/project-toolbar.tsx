"use client";

import { useMemo, useState } from "react";
import { SectionBlock, type SectionData } from "@/components/tracker/section-block";
import type { TaskData } from "@/components/tracker/task-row";
import type { MemberOption } from "@/components/tracker/editable-owner";
import type { NoteData } from "@/components/tracker/note-thread";
import { SummaryStrip } from "@/components/tracker/summary-strip";
import { UsersLegend } from "@/components/tracker/users-legend";
import { ExportButton } from "@/components/tracker/export-button";

type SortMode = "topic" | "owner" | "date";

export type FlatTaskData = TaskData & { sectionId: string };

const STATUS_OPTIONS = [
  { value: "not_started", label: "Not started" },
  { value: "in_progress", label: "In progress" },
  { value: "blocked", label: "Blocked" },
  { value: "done", label: "Done" },
];

export function ProjectToolbar({
  projectId,
  sections,
  tasks,
  notesByTask,
  members,
}: {
  projectId: string;
  sections: SectionData[];
  tasks: FlatTaskData[];
  notesByTask: Record<string, NoteData[]>;
  members: MemberOption[];
}) {
  const [sortMode, setSortMode] = useState<SortMode>("topic");
  const [filterPhase, setFilterPhase] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterOwner, setFilterOwner] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const notesMap = useMemo(
    () => new Map<string, NoteData[]>(Object.entries(notesByTask)),
    [notesByTask]
  );

  const phaseOptions = useMemo(
    () =>
      Array.from(
        new Set(tasks.map((task) => task.phase).filter((phase): phase is string => Boolean(phase)))
      ),
    [tasks]
  );

  const filteredTasks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return tasks
      .filter((task) => !filterPhase || task.phase === filterPhase)
      .filter((task) => !filterStatus || task.status === filterStatus)
      .filter((task) => !filterOwner || task.ownerId === filterOwner)
      .filter((task) => !query || task.title.toLowerCase().includes(query));
  }, [tasks, filterPhase, filterStatus, filterOwner, searchQuery]);

  const metrics = useMemo(() => {
    const total = filteredTasks.length;
    const done = filteredTasks.filter((task) => task.status === "done").length;
    const inProgress = filteredTasks.filter((task) => task.status === "in_progress").length;
    const blocked = filteredTasks.filter((task) => task.status === "blocked").length;
    const noDueDate = filteredTasks.filter((task) => !task.dueDate).length;
    const completePercent = total > 0 ? Math.round((done / total) * 100) : 0;
    return { total, done, inProgress, blocked, noDueDate, completePercent };
  }, [filteredTasks]);

  const renderSections = useMemo(() => {
    if (sortMode === "topic") {
      return sections
        .map((section, index) => ({
          section,
          index,
          tasks: filteredTasks.filter((task) => task.sectionId === section.id),
        }))
        .filter((entry) => entry.tasks.length > 0);
    }

    if (sortMode === "owner") {
      const groups = new Map<string, FlatTaskData[]>();
      for (const task of filteredTasks) {
        const key = task.ownerId ?? "__unassigned";
        const existing = groups.get(key) ?? [];
        existing.push(task);
        groups.set(key, existing);
      }
      const entries: { section: SectionData; index: number; tasks: TaskData[] }[] = [];
      let index = 0;
      for (const [key, groupTasks] of groups.entries()) {
        const owner = key === "__unassigned" ? null : members.find((m) => m.id === key) ?? null;
        entries.push({
          section: { id: `owner-${key}`, title: owner?.name ?? "Unassigned", sortOrder: index },
          index,
          tasks: groupTasks,
        });
        index += 1;
      }
      return entries;
    }

    const sorted = [...filteredTasks].sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.localeCompare(b.dueDate);
    });

    return [
      {
        section: { id: "date-all", title: "All tasks", sortOrder: 0 },
        index: 0,
        tasks: sorted,
      },
    ];
  }, [sortMode, sections, filteredTasks, members]);

  return (
    <div>
      <style>{`
        .toolbar-controls { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
      `}</style>

      <div className="flex flex-wrap items-center gap-2" style={{ margin: "18px 0 12px" }}>
        {(
          [
            { key: "topic", label: "By topic" },
            { key: "owner", label: "By owner" },
            { key: "date", label: "By date" },
          ] as { key: SortMode; label: string }[]
        ).map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setSortMode(tab.key)}
            className={
              sortMode === tab.key
                ? "bg-navy text-paper"
                : "border border-line text-muted hover:bg-paper-2"
            }
            style={{
              minHeight: "44px",
              padding: "0 16px",
              fontFamily: "var(--font-mono)",
              fontSize: "9.5px",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              borderRadius: "2px",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="toolbar-controls" style={{ marginBottom: "14px" }}>
        <select
          value={filterPhase ?? ""}
          onChange={(event) => setFilterPhase(event.target.value || null)}
          className="border border-line bg-paper font-mono text-xs text-ink"
          style={{ minHeight: "44px", padding: "0 10px", borderRadius: "2px" }}
        >
          <option value="">All phases</option>
          {phaseOptions.map((phase) => (
            <option key={phase} value={phase}>
              {phase}
            </option>
          ))}
        </select>

        <select
          value={filterStatus ?? ""}
          onChange={(event) => setFilterStatus(event.target.value || null)}
          className="border border-line bg-paper font-mono text-xs text-ink"
          style={{ minHeight: "44px", padding: "0 10px", borderRadius: "2px" }}
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>

        <select
          value={filterOwner ?? ""}
          onChange={(event) => setFilterOwner(event.target.value || null)}
          className="border border-line bg-paper font-mono text-xs text-ink"
          style={{ minHeight: "44px", padding: "0 10px", borderRadius: "2px" }}
        >
          <option value="">All owners</option>
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </select>

        <input
          type="text"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search tasks"
          className="border border-line bg-paper font-mono text-xs text-ink"
          style={{ minHeight: "44px", padding: "0 10px", borderRadius: "2px", minWidth: "180px", flex: "1 1 180px" }}
        />

        <ExportButton projectId={projectId} />
      </div>

      <SummaryStrip metrics={metrics} />

      <UsersLegend members={members} />

      <div className="py-4">
        {renderSections.map(({ section, index, tasks: sectionTasks }) => (
          <SectionBlock
            key={section.id}
            projectId={projectId}
            section={section}
            index={index}
            tasks={sectionTasks}
            notesByTask={notesMap}
            members={members}
          />
        ))}
      </div>
    </div>
  );
}

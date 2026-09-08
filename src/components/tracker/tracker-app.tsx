"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { TopicSection } from "@/components/tracker/topic-section";
import { TaskRowNew, type FlatTask } from "@/components/tracker/task-row-new";
import type { MemberInfo, NoteData } from "@/components/tracker/note-block";
import { StripBar } from "@/components/tracker/strip-bar";
import { UsersLegend } from "@/components/tracker/users-legend";

export type { FlatTask, MemberInfo, NoteData };

type SectionInfo = { id: string; title: string; sortOrder: number };

const PHASE_LABELS: Record<string, string> = {
  remote: "Remote week",
  nyc: "NYC week",
  later: "Later",
};

function phaseLabel(phase: string): string {
  return PHASE_LABELS[phase] ?? phase.charAt(0).toUpperCase() + phase.slice(1);
}

function fmtDate(iso: string | null): string {
  if (!iso) return "No date set";
  const parts = iso.split("-");
  if (parts.length !== 3) return iso;
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  return d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

function byDue(a: FlatTask, b: FlatTask): number {
  const ad = a.dueDate || "9999-99-99";
  const bd = b.dueDate || "9999-99-99";
  if (ad !== bd) return ad < bd ? -1 : 1;
  return 0;
}

export function TrackerApp({
  projectId,
  subtitle,
  title,
  sections,
  tasks,
  notesByTask,
  members,
  isOwner,
}: {
  projectId: string;
  subtitle: string | null;
  title: string;
  sections: SectionInfo[];
  tasks: FlatTask[];
  notesByTask: Record<string, NoteData[]>;
  members: MemberInfo[];
  isOwner: boolean;
}) {
  void isOwner;

  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [view, setView] = useState<"topic" | "owner" | "date">("topic");
  const [filterPhase, setFilterPhase] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterOwner, setFilterOwner] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [newTopicName, setNewTopicName] = useState("");
  const lastUpdatedRef = useRef("");

  useEffect(() => {
    function onVisibility() {
      if (document.visibilityState === "visible") router.refresh();
    }
    document.addEventListener("visibilitychange", onVisibility);

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/version`);
        if (!res.ok) return;
        const { updatedAt } = await res.json();
        if (lastUpdatedRef.current && updatedAt !== lastUpdatedRef.current) {
          router.refresh();
        }
        lastUpdatedRef.current = updatedAt;
      } catch {}
    }, 60000);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      clearInterval(interval);
    };
  }, [projectId, router]);

  function onSave() {
    startTransition(() => router.refresh());
  }

  const phases = useMemo(
    () => Array.from(new Set(tasks.map((t) => t.phase).filter((p): p is string => Boolean(p)))),
    [tasks]
  );

  const filterText = searchQuery.trim().toLowerCase();

  function passes(task: FlatTask): boolean {
    if (filterPhase && task.phase !== filterPhase) return false;
    if (filterStatus === "__open") {
      if (task.status === "done") return false;
    } else if (filterStatus && task.status !== filterStatus) {
      return false;
    }
    if (filterOwner && task.ownerId !== filterOwner) return false;
    if (filterText) {
      const owner = members.find((m) => m.id === task.ownerId);
      const notesText = (notesByTask[task.id] ?? [])
        .map((n) => `${n.content} ${n.authorName ?? ""}`)
        .join(" ");
      const hay = `${task.title} ${notesText} ${owner?.name ?? ""}`.toLowerCase();
      if (hay.indexOf(filterText) === -1) return false;
    }
    return true;
  }

  const isFiltering = !!(filterPhase || filterStatus || filterOwner || filterText);

  const metrics = useMemo(() => {
    const shown = tasks.filter(passes);
    return {
      total: shown.length,
      done: shown.filter((t) => t.status === "done").length,
      inProgress: shown.filter((t) => t.status === "in_progress").length,
      blocked: shown.filter((t) => t.status === "blocked").length,
      noDueDate: shown.filter((t) => !t.dueDate && t.status !== "done").length,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, filterPhase, filterStatus, filterOwner, filterText, notesByTask, members]);

  async function addTopic() {
    const name = newTopicName.trim();
    if (!name) return;
    await fetch(`/api/projects/${projectId}/sections`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: name }),
    });
    setNewTopicName("");
    onSave();
  }

  function downloadBackup() {
    const data = JSON.stringify({ title, subtitle, sections, tasks, notesByTask, members }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${title.replace(/[^A-Za-z0-9]+/g, "_")}_backup.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(a.href), 1500);
  }

  function exportHtml() {
    window.location.href = `/api/projects/${projectId}/export`;
  }

  const renderTopicView = () => {
    if (!sections.length) {
      return <div className="empty">No workstreams yet. Add one below to start.</div>;
    }
    const groups = sections
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((section, i) => {
        const sectionTasks = tasks.filter((t) => t.sectionId === section.id);
        const shown = sectionTasks.filter(passes).sort(byDue);
        return { section, i, sectionTasks, shown };
      })
      .filter((g) => (isFiltering ? g.shown.length > 0 : true));

    if (!groups.length) {
      return <div className="empty">No workstream has a task matching the current filters.</div>;
    }

    return groups.map((g) => (
      <TopicSection
        key={g.section.id}
        projectId={projectId}
        topic={{ id: g.section.id, name: g.section.title }}
        index={g.i}
        tasks={g.shown}
        totalCount={g.sectionTasks.length}
        doneCount={g.sectionTasks.filter((t) => t.status === "done").length}
        isFiltering={isFiltering}
        notesByTask={notesByTask}
        members={members}
        phases={phases}
        defaultPhase={filterPhase}
        onSave={onSave}
      />
    ));
  };

  const renderOwnerView = () => {
    const rows = tasks.filter(passes);
    if (!rows.length) return <div className="empty">Nothing matches the current filters.</div>;

    const sectionById = new Map(sections.map((s) => [s.id, s.title]));
    const groups = new Map<string, FlatTask[]>();
    for (const task of rows) {
      const key = task.ownerId ?? "__unassigned";
      const existing = groups.get(key) ?? [];
      existing.push(task);
      groups.set(key, existing);
    }

    const entries = Array.from(groups.entries()).map(([key, groupTasks]) => {
      const owner = key === "__unassigned" ? null : members.find((m) => m.id === key) ?? null;
      return { key, owner, tasks: groupTasks };
    });

    entries.sort((a, b) => {
      if (!a.owner && !b.owner) return 0;
      if (!a.owner) return 1;
      if (!b.owner) return -1;
      return a.owner.name.localeCompare(b.owner.name);
    });

    return entries.map(({ key, owner, tasks: groupTasks }) => {
      const open = groupTasks.filter((t) => t.status !== "done").length;
      const sorted = groupTasks.slice().sort((a, b) => {
        const ad = a.dueDate || "9999-99-99";
        const bd = b.dueDate || "9999-99-99";
        if (ad !== bd) return ad < bd ? -1 : 1;
        return (sectionById.get(a.sectionId) ?? "").localeCompare(sectionById.get(b.sectionId) ?? "");
      });
      const style = owner ? ({ "--ow": owner.color, "--owbg": `${owner.color}24` } as React.CSSProperties) : undefined;
      return (
        <div key={key}>
          <div className={`divider-owner${owner ? "" : " unassigned"}`} style={style}>
            <b>{owner?.name ?? "Unassigned"}</b>
            <span className="n">
              {open} open of {groupTasks.length}
            </span>
          </div>
          {sorted.map((task) => (
            <TaskRowNew
              key={task.id}
              projectId={projectId}
              task={task}
              notes={notesByTask[task.id] ?? []}
              members={members}
              phases={phases}
              topicName={sectionById.get(task.sectionId)}
              onSave={onSave}
            />
          ))}
        </div>
      );
    });
  };

  const renderDateView = () => {
    const rows = tasks.filter(passes);
    if (!rows.length) return <div className="empty">Nothing matches the current filters.</div>;

    const sectionById = new Map(sections.map((s) => [s.id, s.title]));
    const sorted = rows.slice().sort((a, b) => {
      const ad = a.dueDate || "9999-99-99";
      const bd = b.dueDate || "9999-99-99";
      if (ad !== bd) return ad < bd ? -1 : 1;
      return (sectionById.get(a.sectionId) ?? "").localeCompare(sectionById.get(b.sectionId) ?? "");
    });

    const out: React.ReactNode[] = [];
    let last: string | null = null;
    for (const task of sorted) {
      const label = fmtDate(task.dueDate);
      if (label !== last) {
        out.push(
          <div key={`d-${label}-${task.id}`} className={`divider-date${task.dueDate ? "" : " nodate"}`}>
            {label}
          </div>
        );
        last = label;
      }
      out.push(
        <TaskRowNew
          key={task.id}
          projectId={projectId}
          task={task}
          notes={notesByTask[task.id] ?? []}
          members={members}
          phases={phases}
          topicName={sectionById.get(task.sectionId)}
          onSave={onSave}
        />
      );
    }
    return out;
  };

  return (
    <div className="tracker-scope">
      <div className="rule-top" />
      <div className="wrap">
        <header className="mast">
          <div className="kicker">{subtitle ?? ""}</div>
          <h1>{title}</h1>
          <div className="mast-meta">
            {phases.map((phase, i) => (
              <span key={phase}>
                Phase {i + 1} <b>{phaseLabel(phase)}</b>
              </span>
            ))}
            <span>
              Shared board <b>everyone sees the same data</b>
            </span>
          </div>
        </header>

        <div className="toolbar">
          <div className="seg" role="group" aria-label="View">
            <button type="button" aria-pressed={view === "topic"} onClick={() => setView("topic")}>
              By topic
            </button>
            <button type="button" aria-pressed={view === "owner"} onClick={() => setView("owner")}>
              By owner
            </button>
            <button type="button" aria-pressed={view === "date"} onClick={() => setView("date")}>
              By date
            </button>
          </div>

          <select
            className="filter"
            aria-label="Filter by phase"
            value={filterPhase}
            onChange={(e) => setFilterPhase(e.target.value)}
          >
            <option value="">All phases</option>
            {phases.map((phase) => (
              <option key={phase} value={phase}>
                {phaseLabel(phase)}
              </option>
            ))}
          </select>

          <select
            className="filter"
            aria-label="Filter by status"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All statuses</option>
            <option value="__open">Everything not done</option>
            <option value="not_started">Not started</option>
            <option value="in_progress">In progress</option>
            <option value="blocked">Blocked</option>
            <option value="done">Done</option>
          </select>

          <select
            className="filter"
            aria-label="Filter by owner"
            value={filterOwner}
            onChange={(e) => setFilterOwner(e.target.value)}
          >
            <option value="">All owners</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>

          <input
            className="search"
            type="search"
            placeholder="Search tasks"
            aria-label="Search tasks"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <span className="spacer" />
          <span className={`saving${isPending ? " on" : ""}`}>Saving</span>
          <button type="button" className="btn" onClick={downloadBackup}>
            Backup
          </button>
          <button type="button" className="btn" onClick={exportHtml}>
            Export HTML
          </button>
        </div>

        <StripBar metrics={metrics} />
        <UsersLegend members={members} />

        <main>
          {view === "topic" ? renderTopicView() : view === "owner" ? renderOwnerView() : renderDateView()}
        </main>

        <div className="new-topic">
          <label htmlFor="newTopic">New workstream</label>
          <input
            id="newTopic"
            value={newTopicName}
            onChange={(e) => setNewTopicName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTopic();
              }
            }}
            placeholder="Compliance, Funding, Client onboarding"
            aria-label="New workstream name"
          />
          <button type="button" className="btn primary" onClick={addTopic}>
            Add workstream
          </button>
        </div>

        <footer className="foot">
          <span>
            {tasks.length} tasks across {sections.length} workstreams
          </span>
          <span className="spacer" />
          <span>Changes save automatically for everyone on this board.</span>
        </footer>
      </div>
    </div>
  );
}

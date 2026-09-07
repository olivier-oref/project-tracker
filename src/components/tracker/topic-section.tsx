"use client";

import { useRef, useState } from "react";
import { TaskRowNew, type FlatTask } from "@/components/tracker/task-row-new";
import type { MemberInfo, NoteData } from "@/components/tracker/note-block";

export function TopicSection({
  projectId,
  topic,
  index,
  tasks,
  totalCount,
  doneCount,
  isFiltering,
  notesByTask,
  members,
  phases,
  defaultPhase,
  onSave,
}: {
  projectId: string;
  topic: { id: string; name: string };
  index: number;
  tasks: FlatTask[];
  totalCount: number;
  doneCount: number;
  isFiltering: boolean;
  notesByTask: Record<string, NoteData[]>;
  members: MemberInfo[];
  phases: string[];
  defaultPhase: string;
  onSave: () => void;
}) {
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const addInputRef = useRef<HTMLInputElement | null>(null);

  const pct = totalCount ? Math.round((doneCount / totalCount) * 100) : 0;
  const count = isFiltering ? `${tasks.length} of ${totalCount} shown` : `${doneCount} / ${totalCount}`;

  async function addTask() {
    const title = newTaskTitle.trim();
    if (!title) {
      addInputRef.current?.focus();
      return;
    }
    await fetch(`/api/projects/${projectId}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sectionId: topic.id, title, phase: defaultPhase || undefined }),
    });
    setNewTaskTitle("");
    onSave();
    addInputRef.current?.focus();
  }

  async function deleteSection() {
    if (totalCount && !confirm(`Delete "${topic.name}" and its ${totalCount} tasks?`)) return;
    await fetch(`/api/projects/${projectId}/sections/${topic.id}`, { method: "DELETE" });
    onSave();
  }

  async function renameSection(e: React.FocusEvent<HTMLHeadingElement>) {
    const value = e.currentTarget.textContent?.trim() ?? "";
    if (!value) {
      e.currentTarget.textContent = topic.name;
      return;
    }
    if (value === topic.name) return;
    await fetch(`/api/projects/${projectId}/sections/${topic.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: value }),
    });
    onSave();
  }

  function focusAdd() {
    addInputRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
    addInputRef.current?.focus();
  }

  return (
    <section className="topic">
      <div className="topic-head">
        <span className="topic-mark">{String(index + 1).padStart(2, "0")}</span>
        <h2
          className="topic-name"
          contentEditable
          suppressContentEditableWarning
          onBlur={renameSection}
        >
          {topic.name}
        </h2>
        <span className="topic-count">{count}</span>
        <button type="button" className="btn mini" onClick={focusAdd}>
          + Task
        </button>
        <button type="button" className="kill" aria-label="Delete workstream" onClick={deleteSection}>
          ×
        </button>
      </div>
      <div className="meter">
        <i style={{ width: `${pct}%` }} />
      </div>
      {tasks.length ? (
        tasks.map((task) => (
          <TaskRowNew
            key={task.id}
            projectId={projectId}
            task={task}
            notes={notesByTask[task.id] ?? []}
            members={members}
            phases={phases}
            onSave={onSave}
          />
        ))
      ) : (
        <div className="empty">No tasks in this workstream yet.</div>
      )}
      <div className="add-row">
        <input
          ref={addInputRef}
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTask();
            }
          }}
          placeholder={`Add a task to ${topic.name}`}
          aria-label="New task"
        />
        <button type="button" className="btn primary" onClick={addTask}>
          Add
        </button>
      </div>
    </section>
  );
}

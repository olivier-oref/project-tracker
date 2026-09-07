import { TaskRow, type TaskData } from "@/components/tracker/task-row";
import type { MemberOption } from "@/components/tracker/editable-owner";
import { TaskCard } from "@/components/tracker/task-card";
import type { NoteData } from "@/components/tracker/note-thread";
import { EditableSectionTitle } from "@/components/tracker/editable-section-title";
import { AddTaskRow } from "@/components/tracker/add-task-row";

export type SectionData = {
  id: string;
  title: string;
  sortOrder: number;
};

export function SectionBlock({
  projectId,
  section,
  index,
  tasks,
  notesByTask,
  members,
}: {
  projectId: string;
  section: SectionData;
  index: number;
  tasks: TaskData[];
  notesByTask: Map<string, NoteData[]>;
  members: MemberOption[];
}) {
  const doneCount = tasks.filter((task) => task.status === "done").length;
  const sectionNumber = String(index + 1).padStart(2, "0");
  const phaseSuggestions = Array.from(
    new Set(tasks.map((task) => task.phase).filter((phase): phase is string => Boolean(phase)))
  );

  return (
    <section style={{ marginTop: "38px" }}>
      <div
        className="sticky top-0 z-10 flex items-end gap-3 bg-paper"
        style={{ paddingBottom: "8px", borderBottom: "2px solid var(--color-navy)" }}
      >
        <span
          className="font-mono text-gold"
          style={{ fontSize: "11px", letterSpacing: "0.1em", paddingBottom: "3px" }}
        >
          {sectionNumber}
        </span>
        <EditableSectionTitle
          projectId={projectId}
          sectionId={section.id}
          title={section.title}
        />
        <span
          className="ml-auto font-mono text-muted"
          style={{ fontSize: "11px", paddingBottom: "4px" }}
        >
          {doneCount} / {tasks.length}
        </span>
      </div>

      {/* Desktop: table layout */}
      <div className="hidden md:block">
        <table className="w-full border-collapse" style={{ marginTop: "2px" }}>
          <thead>
            <tr>
              <th
                className="border-b border-line text-left font-mono font-medium text-muted"
                style={{ fontSize: "9.5px", letterSpacing: "0.12em", textTransform: "uppercase", padding: "9px 10px 9px 0", width: "46%" }}
              >
                Task
              </th>
              <th
                className="border-b border-line text-left font-mono font-medium text-muted"
                style={{ fontSize: "9.5px", letterSpacing: "0.12em", textTransform: "uppercase", padding: "9px 10px 9px 0" }}
              >
                Status
              </th>
              <th
                className="border-b border-line text-left font-mono font-medium text-muted"
                style={{ fontSize: "9.5px", letterSpacing: "0.12em", textTransform: "uppercase", padding: "9px 10px 9px 0" }}
              >
                Owner
              </th>
              <th
                className="border-b border-line text-left font-mono font-medium text-muted"
                style={{ fontSize: "9.5px", letterSpacing: "0.12em", textTransform: "uppercase", padding: "9px 10px 9px 0" }}
              >
                Due
              </th>
              <th
                className="border-b border-line text-left font-mono font-medium text-muted"
                style={{ fontSize: "9.5px", letterSpacing: "0.12em", textTransform: "uppercase", padding: "9px 10px 9px 0" }}
              >
                Phase
              </th>
              <th className="w-8 border-b border-line" />
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <TaskRow
                key={task.id}
                projectId={projectId}
                task={task}
                notes={notesByTask.get(task.id) ?? []}
                members={members}
                phaseSuggestions={phaseSuggestions}
              />
            ))}
          </tbody>
        </table>
        <AddTaskRow projectId={projectId} sectionId={section.id} />
      </div>

      {/* Mobile: card layout */}
      <div className="md:hidden">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            projectId={projectId}
            task={task}
            notes={notesByTask.get(task.id) ?? []}
            members={members}
            phaseSuggestions={phaseSuggestions}
          />
        ))}
        <AddTaskRow projectId={projectId} sectionId={section.id} />
      </div>
    </section>
  );
}

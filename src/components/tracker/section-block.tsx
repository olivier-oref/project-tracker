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
    <section className="mb-10">
      <div className="sticky top-0 z-10 flex items-baseline gap-3 border-b-2 border-navy bg-paper py-3">
        <span className="font-mono text-sm text-gold">{sectionNumber}</span>
        <EditableSectionTitle
          projectId={projectId}
          sectionId={section.id}
          title={section.title}
        />
        <span className="ml-auto font-mono text-xs text-muted">
          {doneCount} / {tasks.length}
        </span>
      </div>

      <table className="hidden w-full border-collapse md:table">
        <thead>
          <tr className="border-b border-line text-left font-mono text-[9.5px] uppercase tracking-wide text-muted">
            <th className="px-3 py-2 font-normal">Task</th>
            <th className="px-3 py-2 font-normal">Status</th>
            <th className="px-3 py-2 font-normal">Owner</th>
            <th className="px-3 py-2 font-normal">Due</th>
            <th className="px-3 py-2 font-normal">Phase</th>
            <th className="w-11 px-1 py-2" />
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
      <div className="hidden md:block">
        <AddTaskRow projectId={projectId} sectionId={section.id} />
      </div>

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

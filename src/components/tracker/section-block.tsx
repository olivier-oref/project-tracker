import { TaskRow, type MemberInfo, type TaskData } from "@/components/tracker/task-row";
import { TaskCard } from "@/components/tracker/task-card";
import type { NoteData } from "@/components/tracker/note-thread";

export type SectionData = {
  id: string;
  title: string;
  sortOrder: number;
};

export function SectionBlock({
  section,
  index,
  tasks,
  notesByTask,
  members,
}: {
  section: SectionData;
  index: number;
  tasks: TaskData[];
  notesByTask: Map<string, NoteData[]>;
  members: Map<string, MemberInfo>;
}) {
  const doneCount = tasks.filter((task) => task.status === "done").length;
  const sectionNumber = String(index + 1).padStart(2, "0");

  return (
    <section className="mb-10">
      <div className="sticky top-0 z-10 flex items-baseline gap-3 border-b-2 border-navy bg-paper py-3">
        <span className="font-mono text-sm text-gold">{sectionNumber}</span>
        <h2 className="font-serif text-xl text-navy">{section.title}</h2>
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
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              notes={notesByTask.get(task.id) ?? []}
              members={members}
            />
          ))}
        </tbody>
      </table>

      <div className="md:hidden">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            notes={notesByTask.get(task.id) ?? []}
            members={members}
          />
        ))}
      </div>
    </section>
  );
}

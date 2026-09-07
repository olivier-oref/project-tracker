import { eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  projects,
  projectMembers,
  sections,
  tasks,
  notes,
  users,
} from "../../drizzle/schema";

const STYLE = `:root{--paper:#FAF6EC;--paper-2:#F2ECDD;--paper-3:#EAE2CF;--navy:#16233F;--gold:#A9762E;--line:#DDD3BC;--line-2:#C9BDA0;--ink:#1E2433;--muted:#6E6656;--green:#4A6B45;--rust:#9A4A32}*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font-family:'Libre Franklin',-apple-system,sans-serif;font-size:13.5px;line-height:1.5}.rule{height:5px;background:var(--navy)}.wrap{max-width:1000px;margin:0 auto;padding:0 28px 70px}header{padding:30px 0 20px;border-bottom:1px solid var(--line)}.kick{font-family:'IBM Plex Mono',monospace;font-size:10.5px;letter-spacing:.18em;text-transform:uppercase;color:var(--gold);margin-bottom:9px}h1{font-family:'Fraunces',Georgia,serif;font-weight:600;font-size:36px;line-height:1.08;margin:0 0 8px;color:var(--navy);letter-spacing:-.015em}.sub{color:var(--muted);margin:0;font-family:'IBM Plex Mono',monospace;font-size:11px}.strip{display:flex;flex-wrap:wrap;border-top:1px solid var(--line);margin:22px 0 10px}.sc{flex:1 1 120px;padding:12px 14px 12px 0;border-right:1px solid var(--line)}.sc:last-child{border-right:0}.sn{font-family:'Fraunces',serif;font-size:25px;font-weight:600;color:var(--navy);line-height:1}.sl{font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);margin-top:6px}section{margin-top:38px}.th{display:flex;align-items:flex-end;gap:12px;padding-bottom:8px;border-bottom:2px solid var(--navy)}.mk{font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--gold);letter-spacing:.1em;padding-bottom:3px}h2{font-family:'Fraunces',serif;font-size:20px;font-weight:600;color:var(--navy);margin:0;flex:1 1 auto}.ct{font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--muted);padding-bottom:4px}table{width:100%;border-collapse:collapse;margin-top:2px}th{font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);text-align:left;padding:9px 10px 9px 0;border-bottom:1px solid var(--line);font-weight:500}td{padding:11px 10px 11px 0;border-bottom:1px solid var(--line);vertical-align:top}td.t{width:46%}.n{color:var(--ink);font-size:12px;margin-top:6px;border-left:2px solid var(--line);padding:5px 8px;border-radius:0 2px 2px 0}.nm{display:flex;gap:8px;margin-top:3px;font-family:'IBM Plex Mono',monospace;font-size:9.5px;color:var(--muted);letter-spacing:.05em}.nm b{font-weight:600}.is-done td.t{color:var(--muted);text-decoration:line-through;text-decoration-color:var(--line-2)}.is-done .n{text-decoration:none;display:block}.st,.ow,.ph,.dt,.nodate,.none{font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.09em;text-transform:uppercase;padding:4px 8px;border-radius:2px;display:inline-block;white-space:nowrap;border:1px solid transparent}.st{font-weight:600}.st-open{background:var(--paper-3);color:var(--muted);border-color:var(--line-2)}.st-progress{background:var(--gold);color:#FFF8EA}.st-blocked{background:var(--rust);color:#FDEFEA}.st-done{background:var(--green);color:#F1F6EF}.ow{border-style:solid;font-weight:500;text-transform:none;letter-spacing:.02em;font-size:11px}.ph{background:var(--paper-2);color:var(--navy);border-color:var(--line)}.dt{background:var(--paper-2);color:var(--ink);border-color:var(--line);text-transform:none;font-size:10.5px;letter-spacing:0}.nodate{color:var(--rust);border:1px dashed var(--rust);background:repeating-linear-gradient(45deg,rgba(154,74,50,.07) 0 6px,rgba(154,74,50,.13) 6px 12px)}.none{color:var(--muted);border:0;font-style:italic;text-transform:none;letter-spacing:0;font-size:11.5px}footer{margin-top:48px;padding-top:14px;border-top:1px solid var(--line);font-family:'IBM Plex Mono',monospace;font-size:10.5px;color:var(--muted)}@media print{body{background:#fff}.wrap{padding:0 12px}section{break-inside:avoid}}`;

const STATUS_LABEL: Record<string, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  blocked: "Blocked",
  done: "Done",
};

const STATUS_CLASS: Record<string, string> = {
  not_started: "st-open",
  in_progress: "st-progress",
  blocked: "st-blocked",
  done: "st-done",
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDueDate(dueDate: string | null): string {
  if (!dueDate) return '<span class="nodate">No date</span>';
  const formatted = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${dueDate}T00:00:00`));
  return `<span class="dt">${escapeHtml(formatted)}</span>`;
}

function formatTimestamp(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
    .format(date)
    .replace(",", "");
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function slugifyProjectTitle(title: string): string {
  return slugify(title);
}

export async function generateProjectHTML(projectId: string): Promise<string> {
  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId));

  if (!project) throw new Error("Project not found");

  const projectSections = await db
    .select()
    .from(sections)
    .where(eq(sections.projectId, projectId))
    .orderBy(sections.sortOrder);

  const sectionIds = projectSections.map((section) => section.id);

  const projectTasks = sectionIds.length
    ? await db
        .select()
        .from(tasks)
        .where(inArray(tasks.sectionId, sectionIds))
        .orderBy(tasks.sortOrder)
    : [];

  const taskIds = projectTasks.map((task) => task.id);

  const projectNotes = taskIds.length
    ? await db
        .select({
          id: notes.id,
          taskId: notes.taskId,
          content: notes.content,
          createdAt: notes.createdAt,
          authorId: notes.authorId,
          authorName: users.name,
        })
        .from(notes)
        .leftJoin(users, eq(users.id, notes.authorId))
        .where(inArray(notes.taskId, taskIds))
        .orderBy(notes.createdAt)
    : [];

  const members = await db
    .select({
      userId: projectMembers.userId,
      email: projectMembers.email,
      color: projectMembers.color,
      name: users.name,
    })
    .from(projectMembers)
    .leftJoin(users, eq(users.id, projectMembers.userId))
    .where(eq(projectMembers.projectId, projectId));

  const memberByUserId = new Map<
    string,
    { name: string; color: string }
  >();
  for (const member of members) {
    if (member.userId) {
      memberByUserId.set(member.userId, {
        name: member.name ?? member.email,
        color: member.color,
      });
    }
  }

  const notesByTask = new Map<string, typeof projectNotes>();
  for (const note of projectNotes) {
    const existing = notesByTask.get(note.taskId) ?? [];
    existing.push(note);
    notesByTask.set(note.taskId, existing);
  }

  const tasksBySection = new Map<string, typeof projectTasks>();
  for (const task of projectTasks) {
    const existing = tasksBySection.get(task.sectionId) ?? [];
    existing.push(task);
    tasksBySection.set(task.sectionId, existing);
  }

  const total = projectTasks.length;
  const done = projectTasks.filter((task) => task.status === "done").length;
  const inProgress = projectTasks.filter(
    (task) => task.status === "in_progress"
  ).length;
  const blocked = projectTasks.filter(
    (task) => task.status === "blocked"
  ).length;
  const noDueDate = projectTasks.filter((task) => !task.dueDate).length;
  const completePercent = total > 0 ? Math.round((done / total) * 100) : 0;

  const headerDate = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  const sectionsHtml = projectSections
    .map((section, index) => {
      const sectionTasks = tasksBySection.get(section.id) ?? [];
      const sectionDone = sectionTasks.filter(
        (task) => task.status === "done"
      ).length;

      const rowsHtml = sectionTasks
        .map((task) => {
          const owner = task.ownerId
            ? memberByUserId.get(task.ownerId)
            : null;
          const ownerHtml = owner
            ? `<span class="ow" style="color:${owner.color};background:${owner.color}24;border-color:${owner.color}">${escapeHtml(owner.name)}</span>`
            : `<span class="none">Unassigned</span>`;

          const taskNotes = notesByTask.get(task.id) ?? [];
          const notesHtml = taskNotes
            .map((note) => {
              const authorName = note.authorName ?? "Unattributed";
              const authorColor = note.authorId
                ? memberByUserId.get(note.authorId)?.color
                : null;
              const noteStyle = authorColor
                ? ` style="border-color:${authorColor};background:${authorColor}24"`
                : "";
              const authorStyle = authorColor
                ? ` style="color:${authorColor}"`
                : "";
              const timestamp = formatTimestamp(
                note.createdAt ?? new Date()
              );
              return `<div class="n"${noteStyle}>${escapeHtml(note.content)}<div class="nm"><b${authorStyle}>${escapeHtml(authorName)}</b><span>${escapeHtml(timestamp)}</span></div></div>`;
            })
            .join("");

          const phaseHtml = task.phase
            ? `<span class="ph">${escapeHtml(task.phase)}</span>`
            : `<span class="none">—</span>`;

          const rowClass = task.status === "done" ? "is-done" : "";

          return `<tr class="${rowClass}"><td class="t">${escapeHtml(task.title)}${notesHtml}</td><td><span class="st ${STATUS_CLASS[task.status] ?? "st-open"}">${STATUS_LABEL[task.status] ?? "Not started"}</span></td><td>${ownerHtml}</td><td>${formatDueDate(task.dueDate)}</td><td>${phaseHtml}</td></tr>`;
        })
        .join("");

      return `<section><div class="th"><span class="mk">${String(index + 1).padStart(2, "0")}</span><h2>${escapeHtml(section.title)}</h2><span class="ct">${sectionDone} / ${sectionTasks.length}</span></div><table><thead><tr><th>Task</th><th>Status</th><th>Owner</th><th>Due</th><th>Phase</th></tr></thead><tbody>${rowsHtml}</tbody></table></section>`;
    })
    .join("");

  const exportedOn = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>${escapeHtml(project.title)}</title><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600&family=Libre+Franklin:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap"><style>${STYLE}</style></head><body><div class="rule"></div><div class="wrap"><header>${project.subtitle ? `<div class="kick">${escapeHtml(project.subtitle)}</div>` : ""}<h1>${escapeHtml(project.title)}</h1><p class="sub">Status as at ${escapeHtml(headerDate)}</p></header><div class="strip"><div class="sc"><div class="sn">${total}</div><div class="sl">Tasks</div></div><div class="sc"><div class="sn">${done}</div><div class="sl">Done</div></div><div class="sc"><div class="sn">${inProgress}</div><div class="sl">In progress</div></div><div class="sc"><div class="sn">${blocked}</div><div class="sl">Blocked</div></div><div class="sc"><div class="sn">${noDueDate}</div><div class="sl">No due date</div></div><div class="sc"><div class="sn">${completePercent}%</div><div class="sl">Complete</div></div></div>${sectionsHtml}<footer>Exported from Project Tracker on ${escapeHtml(exportedOn)}.</footer></div></body></html>`;
}

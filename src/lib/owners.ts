// Task owners: a project member (owner_id) or anyone else by name (owner_name), never both.
// Outsiders matter: someone can own a task without having access to the tracker.

export type OwnerRef = { ownerId: string | null; ownerName: string | null };
type Member = { id: string; name: string };

const MAX_NAME = 80;
const norm = (s: string) => s.trim().replace(/\s+\(pending\)$/i, "").toLowerCase();

/** Turns what someone typed into an owner: a member when the name matches one, else the name itself. */
export function resolveOwner(input: string | null | undefined, members: Member[]): OwnerRef {
  const typed = (input ?? "").trim();
  if (!typed) return { ownerId: null, ownerName: null };
  const match = members.find((m) => norm(m.name) === norm(typed));
  if (match) return { ownerId: match.id, ownerName: null };
  return { ownerId: null, ownerName: typed.slice(0, MAX_NAME) };
}

/** Stable grouping/filter key: "u:<userId>" for members, "n:<name>" for outsiders, "" for unassigned. */
export function ownerKey(task: OwnerRef): string {
  if (task.ownerId) return `u:${task.ownerId}`;
  if (task.ownerName) return `n:${task.ownerName.toLowerCase()}`;
  return "";
}

export function ownerLabel(task: OwnerRef, members: Member[]): string {
  if (task.ownerId) return members.find((m) => m.id === task.ownerId)?.name ?? "";
  return task.ownerName ?? "";
}

/** Names offered while typing an owner: members first, then outsiders already used in this project. */
export function ownerSuggestions(members: Member[], tasks: OwnerRef[]): string[] {
  const seen = new Set(members.map((m) => norm(m.name)));
  const outsiders = new Map<string, string>();
  for (const t of tasks) {
    if (t.ownerId || !t.ownerName) continue;
    const key = norm(t.ownerName);
    if (!seen.has(key) && !outsiders.has(key)) outsiders.set(key, t.ownerName);
  }
  return [...members.map((m) => m.name), ...[...outsiders.values()].sort((a, b) => a.localeCompare(b))];
}

// Project phases: an ordered list stored on the project. Tasks hold the phase name as text, so a
// rename or delete has to rewrite the tasks that use it — planPhaseChange works out those writes.

export const MAX_PHASES = 20;
export const MAX_PHASE_LENGTH = 40;

export type PhaseChange = {
  phases: string[];
  /** Tasks with phase `from` get phase `to` (`null` clears it). */
  taskRewrites: { from: string; to: string | null }[];
};

export type PhaseChangeResult = { ok: true; change: PhaseChange } | { ok: false; error: string };

const key = (s: string) => s.trim().toLowerCase();

/**
 * Validates a new phase list against the old one. `renames` maps an old name to its new name.
 * Old phases that are neither kept nor renamed are deleted: their tasks lose the phase.
 */
export function planPhaseChange(
  oldPhases: string[],
  newPhases: unknown,
  renames: unknown = {}
): PhaseChangeResult {
  if (!Array.isArray(newPhases) || newPhases.some((p) => typeof p !== "string")) {
    return { ok: false, error: "phases must be a list of names" };
  }
  if (typeof renames !== "object" || renames === null || Array.isArray(renames)
    || Object.values(renames).some((v) => typeof v !== "string")) {
    return { ok: false, error: "renames must map old names to new names" };
  }

  const phases = (newPhases as string[]).map((p) => p.trim());
  if (phases.some((p) => !p)) return { ok: false, error: "Phase names can't be empty" };
  if (phases.some((p) => p.length > MAX_PHASE_LENGTH)) {
    return { ok: false, error: `Phase names are at most ${MAX_PHASE_LENGTH} characters` };
  }
  if (phases.length > MAX_PHASES) return { ok: false, error: `At most ${MAX_PHASES} phases` };
  if (new Set(phases.map(key)).size !== phases.length) {
    return { ok: false, error: "Phase names must be unique" };
  }

  const renameMap = new Map<string, string>();
  for (const [from, to] of Object.entries(renames as Record<string, string>)) {
    if (!oldPhases.includes(from)) return { ok: false, error: `Unknown phase to rename: ${from}` };
    if (!phases.includes(to.trim())) return { ok: false, error: `Renamed phase missing from the list: ${to}` };
    if (from !== to.trim()) renameMap.set(from, to.trim());
  }

  const taskRewrites: PhaseChange["taskRewrites"] = [];
  for (const old of oldPhases) {
    const renamed = renameMap.get(old);
    if (renamed !== undefined) taskRewrites.push({ from: old, to: renamed });
    else if (!phases.includes(old)) taskRewrites.push({ from: old, to: null });
  }
  return { ok: true, change: { phases, taskRewrites } };
}


import { planPhaseChange, MAX_PHASES } from "./phases";

const old = ["SF", "SF, Monaco", "Monaco"];

describe("planPhaseChange", () => {
  it("adds a phase without touching tasks", () => {
    expect(planPhaseChange(old, [...old, "NYC"])).toEqual({
      ok: true,
      change: { phases: [...old, "NYC"], taskRewrites: [] },
    });
  });

  it("reorders without touching tasks", () => {
    const r = planPhaseChange(old, ["Monaco", "SF", "SF, Monaco"]);
    expect(r).toEqual({ ok: true, change: { phases: ["Monaco", "SF", "SF, Monaco"], taskRewrites: [] } });
  });

  it("renames: tasks follow the new name", () => {
    const r = planPhaseChange(old, ["San Francisco", "SF, Monaco", "Monaco"], { SF: "San Francisco" });
    expect(r).toEqual({
      ok: true,
      change: { phases: ["San Francisco", "SF, Monaco", "Monaco"], taskRewrites: [{ from: "SF", to: "San Francisco" }] },
    });
  });

  it("deletes: tasks lose the phase", () => {
    const r = planPhaseChange(old, ["SF", "Monaco"]);
    expect(r.ok && r.change.taskRewrites).toEqual([{ from: "SF, Monaco", to: null }]);
  });

  it("rename and delete in one change", () => {
    const r = planPhaseChange(old, ["Bay Area", "Monaco"], { SF: "Bay Area" });
    expect(r.ok && r.change.taskRewrites).toEqual([
      { from: "SF", to: "Bay Area" },
      { from: "SF, Monaco", to: null },
    ]);
  });

  it("swapping two names via renames rewrites both", () => {
    const r = planPhaseChange(["A", "B"], ["B", "A"], { A: "B", B: "A" });
    expect(r.ok && r.change.taskRewrites).toEqual([{ from: "A", to: "B" }, { from: "B", to: "A" }]);
  });

  it("trims names; a no-op rename is ignored", () => {
    const r = planPhaseChange(["SF"], ["  SF "], { SF: "SF" });
    expect(r).toEqual({ ok: true, change: { phases: ["SF"], taskRewrites: [] } });
  });

  it.each([
    [["SF", "sf"], "unique"],
    [["SF", " "], "empty"],
    [["x".repeat(41)], "40 characters"],
    [Array.from({ length: MAX_PHASES + 1 }, (_, i) => `P${i}`), "At most"],
    ["SF", "list"],
    [[1], "list"],
  ])("rejects %j", (phases, message) => {
    const r = planPhaseChange(old, phases);
    expect(r.ok).toBe(false);
    expect(!r.ok && r.error).toContain(message);
  });

  it("rejects renames of unknown phases or to names not in the list", () => {
    expect(planPhaseChange(old, old, { Paris: "SF" }).ok).toBe(false);
    expect(planPhaseChange(old, old, { SF: "Berlin" }).ok).toBe(false);
    expect(planPhaseChange(old, old, ["SF"]).ok).toBe(false);
  });
});

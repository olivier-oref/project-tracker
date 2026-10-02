import { availableParallelism } from 'node:os';
// Pure helpers for scripts/e2e-guard.mjs (unit-tested).

/** Parses `memory_pressure -Q` ("System-wide memory free percentage: 82%"); null if unavailable. */
export function parseFreePct(text) {
  const m = /free percentage:\s*(\d+)%/i.exec(text || '');
  return m ? Number(m[1]) : null;
}

/**
 * PIDs of other running `playwright test` processes. `psText` lines are "pid ppid command";
 * this process and all its ancestors (shells, npm, the runner) are never counted.
 */
export function otherRunPids(psText, selfPid) {
  const rows = (psText || '').split('\n')
    .map((l) => l.trim().match(/^(\d+)\s+(\d+)\s+(.*)$/))
    .filter(Boolean)
    .map(([, pid, ppid, cmd]) => ({ pid: Number(pid), ppid: Number(ppid), cmd }));
  const parent = new Map(rows.map((r) => [r.pid, r.ppid]));
  const mine = new Set();
  for (let p = selfPid; p && !mine.has(p); p = parent.get(p)) mine.add(p);
  return rows
    .filter((r) => /playwright(\.js)?\s+test\b/.test(r.cmd) && !mine.has(r.pid))
    .map((r) => r.pid);
}

/**
 * Which of the pids listening on e2e ports the post-run cleanup may kill. `psText` lines are
 * "pid ppid command"; a listener that is `sparePid` or one of its descendants (the warm `next dev`
 * from `npm run e2e:warm` runs its server in a child process) is kept. No spare pid → kill all.
 */
export function serverPidsToKill(listenPids, psText, sparePid) {
  const pids = [...new Set((listenPids || []).map(Number).filter(Boolean))];
  if (!sparePid) return pids;
  const parent = new Map((psText || '').split('\n')
    .map((l) => l.trim().match(/^(\d+)\s+(\d+)/))
    .filter(Boolean)
    .map(([, pid, ppid]) => [Number(pid), Number(ppid)]));
  const descendsFromSpare = (pid) => {
    const seen = new Set();
    for (let p = pid; p && !seen.has(p); p = parent.get(p)) {
      if (p === sparePid) return true;
      seen.add(p);
    }
    return false;
  };
  return pids.filter((pid) => !descendsFromSpare(pid));
}

/**
 * Workers for one e2e run, tiered by free memory at start so the run's low point stays well above
 * the watchdog's 15% abort line. Measured 2026-09-30 (full suite): 2 workers cost ~3 points of free
 * memory, 3 ~7, 5 ~16. So: ≥60% → min(cores − 2, 70% of cores), ≥45% → half the cores,
 * ≥30% → 3, else (or unknown) 2. Never below 2, and a higher tier never gets fewer than a lower one.
 */
export function workersFor(freePct, cores = availableParallelism()) {
  if (freePct === null || freePct === undefined) return 2;
  const half = Math.max(2, Math.floor(cores / 2));
  if (freePct >= 60) return Math.max(half, Math.min(cores - 2, Math.floor(cores * 0.7)));
  if (freePct >= 45) return half;
  if (freePct >= 30) return Math.min(3, half);
  return 2;
}

/** Abort a running suite when free memory falls below `min` percent (unknown → keep going). */
export function shouldAbort(freePct, min = 15) {
  return freePct !== null && freePct !== undefined && freePct < min;
}

/**
 * One log line for docs/testing/e2e-runs.jsonl from Playwright's JSON report plus run context.
 * Missing report (e.g. aborted run) → counts are null.
 */
export function summarizeRun(report, ctx = {}) {
  const st = report?.stats || {};
  const n = (v) => (typeof v === 'number' ? v : null);
  return {
    at: ctx.at ?? null,
    sha: ctx.sha ?? null,
    branch: ctx.branch ?? null,
    trigger: ctx.trigger ?? 'manual',
    args: ctx.args ?? [],
    mode: ctx.mode ?? null, // 'prod' (build + start) or 'dev' (dev server, warm or not)
    buildSec: typeof ctx.buildSec === 'number' && Number.isFinite(ctx.buildSec) ? ctx.buildSec : null,
    workers: n(report?.config?.metadata?.actualWorkers) ?? n(report?.config?.workers),
    durationSec: typeof st.duration === 'number' ? Math.round(st.duration / 100) / 10 : null,
    passed: n(st.expected),
    failed: n(st.unexpected),
    flaky: n(st.flaky),
    skipped: n(st.skipped),
    exitCode: ctx.exitCode ?? null,
    memFreeBefore: ctx.memFreeBefore ?? null,
    memFreeMin: ctx.memFreeMin ?? null,
    memFreeAfter: ctx.memFreeAfter ?? null,
    leftoverBrowsersKilled: ctx.leftovers ?? null,
  };
}

/**
 * Biggest memory users from `ps -Ao rss=,comm=` output, grouped by app (every helper process of
 * "Google Chrome.app" counts as Google Chrome). Returns [{ app, mb }] largest first.
 */
export function topMemoryApps(psOutput, n = 3) {
  const byApp = new Map();
  for (const line of String(psOutput || '').split('\n')) {
    const m = /^\s*(\d+)\s+(.+)$/.exec(line);
    if (!m) continue;
    const cmd = m[2].trim();
    const app = /([^/]+)\.app\//.exec(cmd)?.[1] ?? cmd.split('/').pop();
    byApp.set(app, (byApp.get(app) || 0) + Number(m[1]));
  }
  return [...byApp].map(([app, kb]) => ({ app, mb: Math.round(kb / 1024) }))
    .sort((a, b) => b.mb - a.mb).slice(0, n);
}

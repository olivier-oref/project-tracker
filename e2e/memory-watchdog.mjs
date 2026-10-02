// Playwright globalSetup: while the suite runs, check free memory every 10s and abort the run
// (killing its browsers and e2e servers) if it drops below E2E_ABORT_FREE_PCT (default 15%).
// Origin: contacts-tracker, 2026-09-29, after an overnight e2e memory spiral rebooted the Mac.
import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { availableParallelism, tmpdir } from 'node:os';
import path from 'node:path';

// Lowest free-memory % seen during the run, read by scripts/e2e-run.mjs for the run log.
export const MEM_MIN_FILE = path.join(tmpdir(), `${path.basename(process.cwd())}-e2e-mem-min`);

// Same logic as src/lib/e2eGuard.mjs (unit-tested there); duplicated because Playwright loads
// lib/*.js as CommonJS while plain Node treats it as ESM, so neither import style works for both.
const parseFreePct = (t) => { const m = /free percentage:\s*(\d+)%/i.exec(t || ''); return m ? Number(m[1]) : null; };
const shouldAbort = (free, min) => free !== null && free < min;
export const workersFor = (free, cores = availableParallelism()) => {
  if (free === null || free === undefined) return 2;
  const half = Math.max(2, Math.floor(cores / 2));
  if (free >= 60) return Math.max(half, Math.min(cores - 2, Math.floor(cores * 0.7)));
  return free >= 45 ? half : free >= 30 ? Math.min(3, half) : 2;
};

const sh = (cmd) => { try { return execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }); } catch { return ''; } };
export const freeMemoryPct = () => (process.platform === 'darwin' ? parseFreePct(sh('memory_pressure -Q')) : null);

export default async function globalSetup() {
  const min = Number(process.env.E2E_ABORT_FREE_PCT || 15);
  let lowest = null;
  const sample = () => {
    const free = freeMemoryPct();
    if (free !== null && (lowest === null || free < lowest)) {
      lowest = free;
      try { writeFileSync(MEM_MIN_FILE, String(free)); } catch {}
    }
    if (!shouldAbort(free, min)) return;
    console.error(`\ne2e watchdog: only ${free}% memory free (< ${min}%) — aborting the run and cleaning up.`);
    sh('node scripts/e2e-guard.mjs post');
    process.exit(1);
  };
  sample(); // first reading right away, so short runs are logged too
  const timer = setInterval(sample, 10_000);
  timer.unref();
  return () => clearInterval(timer);
}

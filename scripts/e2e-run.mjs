// Guarded e2e runner: pre-check → run the suite with the given args → cleanup, preserving the
// exit code, and append one line per run to docs/testing/e2e-runs.jsonl (see docs/testing/e2e-log.md).
// Usage: node scripts/e2e-run.mjs [playwright args…]; set E2E_TRIGGER="wave-5 final" to label a run.
import { spawnSync, execSync } from 'node:child_process';
import { readFileSync, rmSync, appendFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { summarizeRun, parseFreePct, topMemoryApps } from '../src/lib/e2eGuard.mjs';
import { liveWarmPid } from './e2e-warm.mjs';
import { BUILD_SEC_FILE } from './e2e-build.mjs';

const sh = (cmd) => { try { return execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { return ''; } };
const freePct = () => (process.platform === 'darwin' ? parseFreePct(sh('memory_pressure -Q')) : null);
const guard = (mode) => spawnSync(process.execPath, ['scripts/e2e-guard.mjs', mode], { stdio: 'inherit' });
const MEM_MIN_FILE = path.join(tmpdir(), `${path.basename(process.cwd())}-e2e-mem-min`);
const REPORT = 'test-results/e2e-report.json';
const LOG = 'docs/testing/e2e-runs.jsonl';

if (guard('pre').status !== 0) process.exit(1);
// Production-mode runs (the merge gate) must build; Playwright would silently reuse the warm dev server.
const warmPid = liveWarmPid();
if (!process.env.E2E_DEV && warmPid) {
  console.error(`e2e: a warm dev server (pid ${warmPid}) holds the e2e port. Stop the warm server first (npm run e2e:warm:stop).`);
  process.exit(1);
}
// Keep the JSON report (the run log reads it) even when a --reporter is passed on the command line.
const args = process.argv.slice(2).map((a) => (a.startsWith('--reporter=') && !a.includes('json') ? `${a},json` : a));
const at = new Date().toISOString();
const memFreeBefore = freePct();
// Below 45% free the run gets fewer workers (see workersFor); say which apps to close for a faster run.
if (memFreeBefore !== null && memFreeBefore < 45 && !process.env.E2E_WORKERS) {
  const top = topMemoryApps(sh('ps -Ao rss=,comm='));
  console.log(`e2e: ${memFreeBefore}% memory free → fewer workers (≥45% for half the cores, ≥60% for more). Biggest users: ${top.map((t) => `${t.app} ${(t.mb / 1024).toFixed(1)} GB`).join(', ')}`);
}
rmSync(MEM_MIN_FILE, { force: true });
rmSync(BUILD_SEC_FILE, { force: true });

const run = spawnSync('npx', ['playwright', 'test', ...args], { stdio: 'inherit', env: { ...process.env, PLAYWRIGHT_JSON_OUTPUT_NAME: REPORT } });

const leftovers = Number(sh("pgrep -f 'ms-playwright/' | wc -l")) || 0;
guard('post');

let report = null;
try { report = JSON.parse(readFileSync(REPORT, 'utf8')); } catch {}
let memFreeMin = null;
try { memFreeMin = Number(readFileSync(MEM_MIN_FILE, 'utf8')); } catch {}
let buildSec = null; // null when no build ran (dev mode, or a reused server)
try { buildSec = Number(readFileSync(BUILD_SEC_FILE, 'utf8')); } catch {}
const record = summarizeRun(report, {
  at, args, mode: process.env.E2E_DEV ? 'dev' : 'prod', buildSec, leftovers, memFreeBefore, memFreeMin, memFreeAfter: freePct(),
  sha: sh('git rev-parse --short HEAD'), branch: sh('git branch --show-current'),
  trigger: process.env.E2E_TRIGGER || 'manual', exitCode: run.status ?? 1,
});
try {
  mkdirSync(path.dirname(LOG), { recursive: true });
  appendFileSync(LOG, JSON.stringify(record) + '\n');
  console.log(`e2e log: ${record.passed ?? '?'} passed, ${record.failed ?? '?'} failed, ${record.flaky ?? '?'} flaky in ${record.durationSec ?? '?'}s (${record.mode}${record.buildSec != null ? `, build ${record.buildSec}s` : ''}), workers ${record.workers ?? '?'}, min free mem ${record.memFreeMin ?? '?'}% → ${LOG}`);
} catch (e) {
  console.error('e2e log: could not write', e.message);
}
process.exit(run.status ?? 1);

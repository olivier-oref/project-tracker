// Guards around e2e runs so unattended testing can't exhaust the machine.
//   node scripts/e2e-guard.mjs pre   → refuse if another e2e run is active or memory is low
//   node scripts/e2e-guard.mjs post  → kill leftover Playwright browsers and e2e servers
//                                      (never the warm dev server from npm run e2e:warm)
// Origin: contacts-tracker, 2026-09-29, after overnight parallel runs likely caused a kernel-memory crash.
import { execSync } from 'node:child_process';
import { parseFreePct, otherRunPids, serverPidsToKill } from '../src/lib/e2eGuard.mjs';
import { liveWarmPid } from './e2e-warm.mjs';

const MIN_FREE_PCT = Number(process.env.E2E_MIN_FREE_PCT || 25);
// Ports the e2e web servers listen on (PORT in playwright.config.mjs and any parallel-agent ports).
const E2E_PORTS = (process.env.E2E_PORTS || '4046,4047,4048,4049,4050').split(',').map(Number);

const sh = (cmd) => { try { return execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }); } catch { return ''; } };

function pre() {
  const others = otherRunPids(sh('ps -Ao pid=,ppid=,command='), process.pid);
  if (others.length) {
    console.error(`e2e-guard: another e2e run is active (pids ${others.join(', ')}). Run one at a time.`);
    process.exit(1);
  }
  const free = process.platform === 'darwin' ? parseFreePct(sh('memory_pressure -Q')) : null;
  if (free !== null && free < MIN_FREE_PCT) {
    console.error(`e2e-guard: only ${free}% memory free (< ${MIN_FREE_PCT}%). Not starting browsers.`);
    process.exit(1);
  }
}

function post() {
  sh("pkill -f 'ms-playwright/' ");
  const listening = E2E_PORTS.flatMap((port) => sh(`lsof -ti tcp:${port} -sTCP:LISTEN`).split('\n').filter(Boolean));
  const warm = liveWarmPid();
  for (const pid of serverPidsToKill(listening, warm ? sh('ps -Ao pid=,ppid=,command=') : '', warm)) sh(`kill ${pid}`);
}

const mode = process.argv[2];
if (!process.argv[1]?.endsWith('e2e-guard.mjs')) { /* imported, not run */ }
else if (mode === 'pre') pre();
else if (mode === 'post') post();
else if (mode) { console.error('usage: e2e-guard.mjs pre|post'); process.exit(2); }

// Warm e2e dev server for iterating on specs without a production build per run.
//   node scripts/e2e-warm.mjs start → detached `next dev` on the e2e port, same env and DB guard as
//                                     Playwright's webServer; pid in .e2e-warm.pid, log in .e2e-warm.log
//   node scripts/e2e-warm.mjs stop  → stop it
// E2E_DEV=1 runs (npm run e2e:spec) reuse it and the post-run cleanup spares it; production-mode
// runs (npm run e2e, e2e:all) refuse to start while it is up.
// Origin: contacts-tracker, 2026-09-30 (69 guarded runs in a day, each paying a production build).
import { spawn, execSync } from 'node:child_process';
import { readFileSync, writeFileSync, rmSync, openSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { loadE2EEnv } from '../e2e/env.mjs';
import { E2E_PORT, e2eServerEnv } from '../e2e/server-env.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const WARM_PID_FILE = path.join(root, '.e2e-warm.pid');
const WARM_LOG = path.join(root, '.e2e-warm.log');
const URL = `http://localhost:${E2E_PORT}/login`;

const alive = (pid) => { try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; } };
const sh = (cmd) => { try { return execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { return ''; } };
const portBusy = () => sh(`lsof -ti tcp:${E2E_PORT} -sTCP:LISTEN`) !== '';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Pid of the running warm server, or null (a stale pid file is removed). */
export function liveWarmPid() {
  let pid = null;
  try { pid = Number(readFileSync(WARM_PID_FILE, 'utf8').trim()) || null; } catch { return null; }
  if (pid && alive(pid)) return pid;
  rmSync(WARM_PID_FILE, { force: true });
  return null;
}

async function start() {
  const running = liveWarmPid();
  if (running) { console.log(`e2e-warm: already running (pid ${running}) on ${URL}`); return; }
  if (portBusy()) {
    console.error(`e2e-warm: port ${E2E_PORT} is already in use (a leftover e2e server? try npm run e2e:cleanup).`);
    process.exit(1);
  }
  const env = loadE2EEnv(); // throws unless .env.test.local points at the e2e database
  const log = openSync(WARM_LOG, 'w');
  const child = spawn('npx', ['next', 'dev', '-p', String(E2E_PORT)], {
    cwd: root, detached: true, stdio: ['ignore', log, log], env: { ...process.env, ...e2eServerEnv(env) },
  });
  child.unref();
  writeFileSync(WARM_PID_FILE, String(child.pid));
  // Wait until the login page answers, so the first spec run doesn't pay the first compile.
  for (let i = 0; i < 120; i++) {
    if (!alive(child.pid)) break;
    try { if ((await fetch(URL)).ok) { console.log(`e2e-warm: ready on ${URL} (pid ${child.pid}, log .e2e-warm.log). Stop with npm run e2e:warm:stop.`); return; } } catch {}
    await sleep(1000);
  }
  console.error(`e2e-warm: server did not come up; see .e2e-warm.log.`);
  stop();
  process.exit(1);
}

function stop() {
  const pid = liveWarmPid();
  if (!pid) { console.log('e2e-warm: not running.'); return; }
  // Detached → its own process group: stop npx, next dev and the server child together.
  try { process.kill(-pid, 'SIGTERM'); } catch { try { process.kill(pid, 'SIGTERM'); } catch {} }
  rmSync(WARM_PID_FILE, { force: true });
  console.log(`e2e-warm: stopped (pid ${pid}).`);
}

if (process.argv[1]?.endsWith('e2e-warm.mjs')) {
  const mode = process.argv[2];
  if (mode === 'start') await start();
  else if (mode === 'stop') stop();
  else { console.error('usage: e2e-warm.mjs start|stop'); process.exit(2); }
}

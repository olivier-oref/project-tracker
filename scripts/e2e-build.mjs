// Production build for the e2e webServer (the webServer command in playwright.config.mjs), timed: writes the build's
// seconds to BUILD_SEC_FILE so scripts/e2e-run.mjs can log `buildSec`. Exits with next build's code.
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

export const BUILD_SEC_FILE = path.join(tmpdir(), `${path.basename(process.cwd())}-e2e-build-sec`);

if (process.argv[1]?.endsWith('e2e-build.mjs')) {
  const t0 = Date.now();
  const r = spawnSync('npx', ['next', 'build'], { stdio: 'inherit' });
  try { writeFileSync(BUILD_SEC_FILE, String(Math.round((Date.now() - t0) / 100) / 10)); } catch {}
  process.exit(r.status ?? 1);
}

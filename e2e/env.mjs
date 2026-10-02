// Loads .env.test.local for e2e runs and refuses to touch any database except the Neon `e2e`
// branch, so tests can never write real data. Uses the same host table as the app's own guard
// (src/lib/dbTarget.mjs): the URL must resolve to 'e2e', not merely "not production".
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { dbTargetOf, DB_HOSTS } from '../src/lib/dbTarget.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const ENV_FILE = path.join(root, '.env.test.local');
export const REQUIRED_KEYS = ['DATABASE_URL', 'AUTH_SECRET', 'E2E_EMAIL', 'E2E_PASSWORD'];

/** Parses KEY=value lines (quotes stripped, comments and other lines ignored). */
export function parseEnvFile(text) {
  const env = {};
  for (const line of text.split('\n')) {
    const m = /^\s*(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line);
    if (!m) continue;
    env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
  return env;
}

/** Throws unless every required key is set and DATABASE_URL is the e2e branch. Never echoes values. */
export function checkE2EEnv(env, hosts = DB_HOSTS) {
  for (const k of REQUIRED_KEYS) {
    if (!env[k]) throw new Error(`.env.test.local is missing ${k}`);
  }
  const target = dbTargetOf(env.DATABASE_URL, hosts);
  if (target !== 'e2e') {
    throw new Error(`Refusing to run: DATABASE_URL points at '${target}', not the Neon e2e branch (${hosts.e2e}).`);
  }
  return env;
}

export function loadE2EEnv() {
  if (!existsSync(ENV_FILE)) {
    throw new Error(`Missing .env.test.local (create it with ${REQUIRED_KEYS.join(', ')}).`);
  }
  return checkE2EEnv(parseEnvFile(readFileSync(ENV_FILE, 'utf8')));
}

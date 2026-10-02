// Which database a connection string points at, and whether this process may use it.
// Standard (claude-standards/project-standards): only the production deployment may talk to the
// production database; previews and local dev use `dev`, e2e uses `e2e`. Scripts that deliberately
// target production (migrations, backfills) opt in with ALLOW_PROD_DB=1, after taking a snapshot.
//
// Fill DB_HOSTS with a stable, non-secret part of each database's hostname:
//   Neon:    the endpoint id, e.g. 'ep-frosty-shape-ajvx8wsr' (pooled hosts add '-pooler')
//   Railway: the service's private/public host, e.g. 'postgres-production-1a2b.up.railway.app'
//            or the proxy host+port pair's host. Leave a key empty ('') if that environment doesn't exist.
export const DB_HOSTS = {
  production: 'ep-morning-silence-aufzhvx1',
  dev: '', // TODO: Neon dev branch endpoint id
  e2e: '', // TODO: Neon e2e branch endpoint id
};

/** 'production' | 'dev' | 'e2e' | 'unknown' for a connection string (never throws, never echoes it). */
export function dbTargetOf(url, hosts = DB_HOSTS) {
  let host;
  try { host = new URL(url).hostname; } catch { return 'unknown'; }
  for (const [name, id] of Object.entries(hosts)) {
    if (!id || id.startsWith('__')) continue;
    if (host === id || host.startsWith(`${id}-`) || host.startsWith(`${id}.`)) return name;
  }
  return 'unknown';
}

/** True when this process is the production deployment (Vercel, Railway, or an explicit APP_ENV). */
export function isProductionDeployment(env = process.env) {
  return env.VERCEL_ENV === 'production'
    || env.RAILWAY_ENVIRONMENT_NAME === 'production'
    || env.APP_ENV === 'production';
}

/** Throws when a non-production process is about to use the production database. */
export function assertDbTarget(url, { env = process.env, hosts = DB_HOSTS } = {}) {
  if (dbTargetOf(url, hosts) !== 'production') return;
  if (isProductionDeployment(env) || env.ALLOW_PROD_DB === '1') return;
  const where = env.VERCEL_ENV || env.RAILWAY_ENVIRONMENT_NAME || env.APP_ENV || 'local';
  throw new Error(
    `Refusing to use the production database outside production (environment: ${where}). `
    + 'Point the database URL at the dev branch/environment, or set ALLOW_PROD_DB=1 for a deliberate production script.',
  );
}

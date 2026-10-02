import { dbTargetOf, assertDbTarget, isProductionDeployment } from './dbTarget.mjs';

const hosts = { production: 'ep-prod-aaa', dev: 'ep-dev-bbb', e2e: 'postgres-e2e.up.railway.app' };
const url = (host) => `postgresql://user:pw@${host}.c-3.us-east-2.aws.neon.tech/db?sslmode=require`;
const PROD = url('ep-prod-aaa');
const PROD_POOLED = url('ep-prod-aaa-pooler');
const DEV = url('ep-dev-bbb-pooler');
const RAILWAY_E2E = 'postgresql://u:pw@postgres-e2e.up.railway.app:5432/railway';

describe('dbTargetOf', () => {
  it('recognises each target, pooled or direct, Neon or Railway', () => {
    expect(dbTargetOf(PROD, hosts)).toBe('production');
    expect(dbTargetOf(PROD_POOLED, hosts)).toBe('production');
    expect(dbTargetOf(DEV, hosts)).toBe('dev');
    expect(dbTargetOf(RAILWAY_E2E, hosts)).toBe('e2e');
  });
  it('is unknown for other hosts, look-alikes, garbage, and unfilled placeholders', () => {
    expect(dbTargetOf(url('ep-prod-aaax'), hosts)).toBe('unknown');
    expect(dbTargetOf('not a url', hosts)).toBe('unknown');
    expect(dbTargetOf(undefined, hosts)).toBe('unknown');
    expect(dbTargetOf(PROD, { production: '__PROD_DB_HOST__' })).toBe('unknown');
  });
});

describe('isProductionDeployment', () => {
  it('knows Vercel, Railway and APP_ENV production', () => {
    expect(isProductionDeployment({ VERCEL_ENV: 'production' })).toBe(true);
    expect(isProductionDeployment({ RAILWAY_ENVIRONMENT_NAME: 'production' })).toBe(true);
    expect(isProductionDeployment({ APP_ENV: 'production' })).toBe(true);
    expect(isProductionDeployment({ VERCEL_ENV: 'preview', RAILWAY_ENVIRONMENT_NAME: 'dev' })).toBe(false);
    expect(isProductionDeployment({})).toBe(false);
  });
});

describe('assertDbTarget', () => {
  it('allows production only in the production deployment', () => {
    expect(() => assertDbTarget(PROD, { env: { VERCEL_ENV: 'production' }, hosts })).not.toThrow();
    expect(() => assertDbTarget(PROD, { env: { RAILWAY_ENVIRONMENT_NAME: 'production' }, hosts })).not.toThrow();
    expect(() => assertDbTarget(PROD_POOLED, { env: { VERCEL_ENV: 'preview' }, hosts })).toThrow(/environment: preview/);
    expect(() => assertDbTarget(PROD, { env: {}, hosts })).toThrow(/environment: local/);
  });
  it('lets a deliberate production script opt in with exactly ALLOW_PROD_DB=1', () => {
    expect(() => assertDbTarget(PROD, { env: { ALLOW_PROD_DB: '1' }, hosts })).not.toThrow();
    expect(() => assertDbTarget(PROD, { env: { ALLOW_PROD_DB: 'true' }, hosts })).toThrow();
  });
  it('never blocks dev, e2e or unknown targets', () => {
    for (const u of [DEV, RAILWAY_E2E, url('ep-other')]) {
      expect(() => assertDbTarget(u, { env: { VERCEL_ENV: 'preview' }, hosts })).not.toThrow();
    }
  });
  it('never puts the connection string (credentials) in the error', () => {
    try { assertDbTarget(PROD, { env: {}, hosts }); } catch (e) { expect(e.message).not.toMatch(/pw|neon\.tech/); }
  });
});

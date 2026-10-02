import { parseEnvFile, checkE2EEnv } from './env.mjs';

const hosts = { production: 'ep-prod-1', dev: 'ep-dev-1', e2e: 'ep-e2e-1' };
const url = (ep) => `postgresql://u:p@${ep}.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require`;
const full = (over = {}) => ({ DATABASE_URL: url('ep-e2e-1'), AUTH_SECRET: 's', E2E_EMAIL: 'e@x', E2E_PASSWORD: 'p', ...over });

describe('parseEnvFile', () => {
  it('reads KEY=value lines, strips quotes and export, skips the rest', () => {
    expect(parseEnvFile('# c\nA=1\nexport B="two"\n  C = \'3\'  \nnot a line\n')).toEqual({ A: '1', B: 'two', C: '3' });
  });
  it('keeps = signs inside values (connection strings)', () => {
    expect(parseEnvFile('DATABASE_URL=postgres://h/db?sslmode=require&x=y').DATABASE_URL).toBe('postgres://h/db?sslmode=require&x=y');
  });
});

describe('checkE2EEnv', () => {
  it('accepts the e2e branch (direct and pooled hosts)', () => {
    expect(() => checkE2EEnv(full(), hosts)).not.toThrow();
    expect(() => checkE2EEnv(full({ DATABASE_URL: url('ep-e2e-1-pooler') }), hosts)).not.toThrow();
  });
  it.each([['production', 'ep-prod-1'], ['dev', 'ep-dev-1'], ['unknown', 'ep-other-9']])('refuses %s', (name, ep) => {
    expect(() => checkE2EEnv(full({ DATABASE_URL: url(ep) }), hosts)).toThrow(`'${name}'`);
  });
  it('refuses a garbage URL', () => {
    expect(() => checkE2EEnv(full({ DATABASE_URL: 'not a url' }), hosts)).toThrow(/Refusing/);
  });
  it.each(['DATABASE_URL', 'AUTH_SECRET', 'E2E_EMAIL', 'E2E_PASSWORD'])('requires %s', (k) => {
    expect(() => checkE2EEnv(full({ [k]: '' }), hosts)).toThrow(`missing ${k}`);
  });
  it('never echoes the connection string', () => {
    let message = '';
    try { checkE2EEnv(full({ DATABASE_URL: url('ep-prod-1') }), hosts); } catch (e) { message = e.message; }
    expect(message).toMatch(/Refusing/);
    expect(message).not.toContain('u:p@');
  });
});

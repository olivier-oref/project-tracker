// Creates (or resets the password of) the e2e test user on the Neon `e2e` branch.
// Usage: npm run e2e:user   (reads .env.test.local; refuses any database but e2e)
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import { loadE2EEnv } from '../e2e/env.mjs';

const env = loadE2EEnv();
const sql = neon(env.DATABASE_URL);
const email = env.E2E_EMAIL.trim().toLowerCase();
const hash = await bcrypt.hash(env.E2E_PASSWORD, 10);

const [row] = await sql`
  INSERT INTO users (email, name, password_hash)
  VALUES (${email}, 'E2E Tester', ${hash})
  ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
  RETURNING id`;
console.log(`e2e user ready (id ${row.id}).`);

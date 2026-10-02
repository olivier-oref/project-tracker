// E2e config (project-standards). Server env keys live in e2e/server-env.mjs; DB guard in e2e/env.mjs.
import { defineConfig, devices } from '@playwright/test';
import { loadE2EEnv } from './e2e/env.mjs';
import { freeMemoryPct, workersFor } from './e2e/memory-watchdog.mjs';
import { E2E_PORT as PORT, e2eServerEnv } from './e2e/server-env.mjs';

const env = loadE2EEnv();
// Default: production build (pages served instantly, like Vercel). E2E_DEV=1 uses `next dev`
// (or reuses the warm one from `npm run e2e:warm`).
const serverCommand = process.env.E2E_DEV
  ? `npx next dev -p ${PORT}`
  : `node scripts/e2e-build.mjs && npx next start -p ${PORT}`; // e2e-build times the build for the run log

export default defineConfig({
  testDir: './e2e',
  // Spec files run in parallel (each creates and deletes its own records); tests inside a file stay in order.
  fullyParallel: false,
  // Tiered by free memory at start; the watchdog (globalSetup) aborts below 15% free.
  workers: Number(process.env.E2E_WORKERS) || workersFor(freeMemoryPct()),
  globalSetup: './e2e/memory-watchdog.mjs',
  retries: 0,
  // json → read by scripts/e2e-run.mjs to append one line per run to docs/testing/e2e-runs.jsonl
  reporter: [['list'], ['html', { open: 'never' }], ['json', { outputFile: 'test-results/e2e-report.json' }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    serviceWorkers: 'block',
    timezoneId: 'America/New_York',
    locale: 'en-US',
    video: process.env.E2E_VIDEO ? 'retain-on-failure' : 'off',
    screenshot: 'on',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.mjs/ },
    {
      name: 'iphone',
      use: { ...devices['iPhone 14'], storageState: 'e2e/.auth/user.json' },
      dependencies: ['setup'],
      testMatch: /.*\.spec\.mjs/,
    },
    {
      name: 'pixel',
      use: { ...devices['Pixel 7'], storageState: 'e2e/.auth/user.json' },
      dependencies: ['setup'],
      testMatch: /.*\.spec\.mjs/,
    },
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], storageState: 'e2e/.auth/user.json' },
      dependencies: ['setup'],
      testMatch: /.*\.spec\.mjs/,
    },
  ],
  webServer: {
    command: serverCommand,
    url: `http://localhost:${PORT}/auth/signin`,
    reuseExistingServer: true,
    timeout: 300_000,
    env: e2eServerEnv(env),
  },
});

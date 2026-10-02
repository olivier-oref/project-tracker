// Signs in once through the real sign-in page (NextAuth credentials) and saves the session cookie.
import { test as setup, expect } from '@playwright/test';
import { loadE2EEnv } from './env.mjs';

setup('sign in as the e2e user', async ({ page }) => {
  const env = loadE2EEnv();
  await page.goto('/auth/signin');
  await page.getByPlaceholder('Email').fill(env.E2E_EMAIL);
  await page.getByPlaceholder('Password').fill(env.E2E_PASSWORD);
  await page.getByRole('button', { name: /^sign in$/i }).click();
  await expect(page, 'sign-in failed — run `npm run e2e:user` first').toHaveURL(/\/dashboard/);
  await expect(page.getByRole('heading', { name: 'Project Tracker', level: 1 })).toBeVisible();
  await page.context().storageState({ path: 'e2e/.auth/user.json' });
});

// Faster Fixes widget: inert for normal users, wired to our project for reviewers. The Faster Fixes
// API is stubbed — specs never reach the real service.
import { test, expect } from '@playwright/test';

const FF_API = 'https://www.faster-fixes.com/api/**';

/** Stubs the Faster Fixes API (CORS included) and returns the requests the widget made. */
async function stubFasterFixes(page) {
  const calls = [];
  await page.route(FF_API, async (route) => {
    const req = route.request();
    const cors = {
      'Access-Control-Allow-Origin': req.headers().origin ?? '*',
      'Access-Control-Allow-Headers': 'X-API-Key, X-Reviewer-Token, Content-Type',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    };
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
    calls.push({ path: new URL(req.url()).pathname, headers: req.headers() });
    const json = new URL(req.url()).pathname.endsWith('/widget/config')
      ? { enabled: true, branding: false }
      : { feedback: [] };
    return route.fulfill({ status: 200, headers: cors, json });
  });
  return calls;
}

test.describe('feedback widget', () => {
  test('normal visitors trigger no Faster Fixes requests', async ({ page }) => {
    const calls = await stubFasterFixes(page);
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: 'Project Tracker', level: 1 })).toBeVisible();
    await page.waitForLoadState('networkidle');
    expect(calls).toEqual([]);
  });

  test('a reviewer link activates the widget for our project and hides the token', async ({ page }) => {
    const calls = await stubFasterFixes(page);
    await page.goto('/dashboard?ff_token=rt_e2e_token');
    await expect.poll(() => calls.find((c) => c.path === '/api/v1/widget/config')).toBeTruthy();

    const config = calls.find((c) => c.path === '/api/v1/widget/config');
    expect(config.headers['x-api-key']).toBe('proj_80a273e6ef05133c46ad7c92');
    expect(page.url()).not.toContain('ff_token');
  });
});

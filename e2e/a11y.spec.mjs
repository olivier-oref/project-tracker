// Accessibility scan (axe). Fails on `critical` only until the UI's accessibility pass lands;
// serious/moderate findings are attached to the report for that pass.
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { dataTracker, uniquePrefix, openProject } from './helpers.mjs';

async function scan(page, testInfo, name) {
  const results = await new AxeBuilder({ page }).analyze();
  await testInfo.attach(`axe-${name}.json`, { body: JSON.stringify(results.violations, null, 2), contentType: 'application/json' });
  return results.violations.filter((v) => v.impact === 'critical').map((v) => `${v.id}: ${v.help} (${v.nodes.length})`);
}

test.describe('accessibility', () => {
  let data;
  test.beforeEach(async ({ request }) => { data = dataTracker(request); });
  test.afterEach(async () => { await data.cleanup(); });

  test('dashboard and board have no critical axe violations', async ({ page }, testInfo) => {
    const project = await data.project(uniquePrefix(testInfo.title));
    const section = await data.section(project.id, 'Ops');
    await data.task(project.id, { sectionId: section.id, title: 'Order GPUs' });

    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: project.title, level: 2, exact: true })).toBeVisible();
    const dashboard = await scan(page, testInfo, 'dashboard');

    await openProject(page, project);
    await expect(page.locator('.task')).toHaveCount(1);
    const board = await scan(page, testInfo, 'board');

    expect({ dashboard, board }).toEqual({ dashboard: [], board: [] });
  });
});

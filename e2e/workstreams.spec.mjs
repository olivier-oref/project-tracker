// Workstream reorder (issue #5): swapping positions must work on the real driver (neon-http has no
// interactive transactions) and the board must show the new order.
import { test, expect } from '@playwright/test';
import { dataTracker, uniquePrefix, openProject } from './helpers.mjs';

test.describe('workstreams', () => {
  let data;
  test.beforeEach(async ({ request }) => { data = dataTracker(request); });
  test.afterEach(async () => { await data.cleanup(); });

  test('moving a workstream swaps it with the one in that position', async ({ page, request }, testInfo) => {
    const project = await data.project(uniquePrefix(testInfo.title));
    await data.section(project.id, 'Alpha');
    const beta = await data.section(project.id, 'Beta');

    const res = await request.patch(`/api/projects/${project.id}/sections/${beta.id}`, { data: { sortOrder: 0 } });
    expect(res.status(), await res.text()).toBe(200);
    expect((await res.json()).sortOrder).toBe(0);

    await openProject(page, project);
    const headings = page.locator('main h2');
    await expect(headings).toHaveText(['Beta', 'Alpha']);
  });
});

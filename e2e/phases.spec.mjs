// Phases are a managed, ordered list per project. Renames carry tasks along, deletes clear them
// (after a confirm), reorders persist, and a swap via renames never collapses two phases into one.
import { test, expect } from '@playwright/test';
import { dataTracker, uniquePrefix, openProject, handleDialogs, collectPageErrors } from './helpers.mjs';

test.describe('phases', () => {
  let data;
  test.beforeEach(async ({ request }) => { data = dataTracker(request); });
  test.afterEach(async () => { await data.cleanup(); });

  const heading = (page) => page.locator('.mast-meta > span b');
  const putPhases = async (request, project, body) => {
    const res = await request.put(`/api/projects/${project.id}/phases`, { data: body });
    expect(res.ok(), await res.text()).toBeTruthy();
  };

  async function savePhases(page) {
    const saved = page.waitForResponse((r) => r.url().endsWith('/phases') && r.request().method() === 'PUT');
    await page.getByRole('button', { name: 'Save phases' }).click();
    expect((await saved).ok()).toBeTruthy();
    await expect(page.getByRole('group', { name: 'Edit phases' })).toHaveCount(0);
  }

  test('add phases from an empty project, then assign one to a task', async ({ page }, testInfo) => {
    const errors = collectPageErrors(page);
    const project = await data.project(uniquePrefix(testInfo.title));
    const section = await data.section(project.id, 'Ops');
    await data.task(project.id, { sectionId: section.id, title: 'Order GPUs' });
    await openProject(page, project);

    await page.getByRole('button', { name: 'Add phases' }).click();
    await expect(page.getByText('No phases yet')).toBeVisible();
    for (const name of ['SF', 'Monaco']) {
      await page.getByLabel('New phase name').fill(name);
      await page.getByLabel('New phase name').press('Enter');
    }
    await page.screenshot({ path: testInfo.outputPath('editor.png') });
    await savePhases(page);
    await expect(heading(page)).toHaveText(['SF', 'Monaco', 'everyone sees the same data']);

    const task = page.locator('.task').first();
    const saved = page.waitForResponse((r) => r.url().includes('/tasks/') && r.request().method() === 'PATCH');
    await task.getByLabel('Phase').selectOption('Monaco');
    expect((await saved).ok()).toBeTruthy();
    await page.reload();
    await expect(task.getByLabel('Phase')).toHaveValue('Monaco');
    await expect(page.getByLabel('Filter by phase').locator('option')).toHaveText(['All phases', 'SF', 'Monaco']);
    expect(errors).toEqual([]);
  });

  test('rename carries tasks along; reorder persists', async ({ page, request }, testInfo) => {
    const project = await data.project(uniquePrefix(testInfo.title));
    await putPhases(request, project, { phases: ['SF', 'Monaco'] });
    const section = await data.section(project.id, 'Ops');
    await data.task(project.id, { sectionId: section.id, title: 'Book flights', phase: 'SF' });
    await openProject(page, project);

    await page.getByRole('button', { name: 'Edit phases' }).click();
    await page.getByLabel('Phase 1 name').fill('San Francisco');
    await page.getByRole('button', { name: 'Move Monaco up' }).click();
    await savePhases(page);

    await page.reload();
    await expect(heading(page)).toHaveText(['Monaco', 'San Francisco', 'everyone sees the same data']);
    await expect(page.locator('.task').first().getByLabel('Phase')).toHaveValue('San Francisco');
  });

  test('delete asks first; cancel keeps it, confirm clears it from tasks', async ({ page, request }, testInfo) => {
    const project = await data.project(uniquePrefix(testInfo.title));
    await putPhases(request, project, { phases: ['SF', 'Monaco'] });
    const section = await data.section(project.id, 'Ops');
    await data.task(project.id, { sectionId: section.id, title: 'Book flights', phase: 'SF' });
    await openProject(page, project);
    const dialogs = handleDialogs(page, 'dismiss');

    await page.getByRole('button', { name: 'Edit phases' }).click();
    await page.getByRole('button', { name: 'Delete SF' }).click();
    await page.getByRole('button', { name: 'Save phases' }).click();
    expect(dialogs.messages[0]).toMatch(/SF: 1 task will lose this phase/);
    // Dismissed: the panel stays open with the edit, nothing saved.
    await expect(page.getByRole('group', { name: 'Edit phases' })).toBeVisible();

    dialogs.answer = 'accept';
    await savePhases(page);
    await page.reload();
    await expect(heading(page)).toHaveText(['Monaco', 'everyone sees the same data']);
    // A task whose phase isn't listed would also show "No phase": re-add SF to prove the task was cleared.
    await putPhases(request, project, { phases: ['Monaco', 'SF'] });
    await page.reload();
    await expect(page.locator('.task').first().getByLabel('Phase')).toHaveValue('');
  });

  test('swapping two names via renames keeps each task on its own phase', async ({ page, request }, testInfo) => {
    const project = await data.project(uniquePrefix(testInfo.title));
    await putPhases(request, project, { phases: ['A', 'B'] });
    const section = await data.section(project.id, 'Ops');
    await data.task(project.id, { sectionId: section.id, title: 'First', phase: 'A' });
    await data.task(project.id, { sectionId: section.id, title: 'Second', phase: 'B' });

    await putPhases(request, project, { phases: ['B', 'A'], renames: { A: 'B', B: 'A' } });
    await openProject(page, project);
    const rows = page.locator('.task');
    await expect(rows.nth(0).getByLabel('Phase')).toHaveValue('B');
    await expect(rows.nth(1).getByLabel('Phase')).toHaveValue('A');
  });

  test("tasks only take the project's phases", async ({ request }, testInfo) => {
    const project = await data.project(uniquePrefix(testInfo.title));
    await putPhases(request, project, { phases: ['SF'] });
    const section = await data.section(project.id, 'Ops');
    const res = await request.post(`/api/projects/${project.id}/tasks`, { data: { sectionId: section.id, title: 'x', phase: 'Paris' } });
    expect(res.status()).toBe(400);
  });
});

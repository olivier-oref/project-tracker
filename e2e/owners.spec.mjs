// Task owners: members are suggested and linked; anyone else's name is kept as typed (they may
// own a task without access to the tracker).
import { test, expect } from '@playwright/test';
import { dataTracker, uniquePrefix, openProject, waitForSave, collectPageErrors } from './helpers.mjs';

test.describe('task owners', () => {
  let data;
  test.beforeEach(async ({ request }) => { data = dataTracker(request); });
  test.afterEach(async () => { await data.cleanup(); });

  async function boardWithOneTask(page, testInfo) {
    const project = await data.project(uniquePrefix(testInfo.title));
    const section = await data.section(project.id, 'Ops');
    await data.task(project.id, { sectionId: section.id, title: 'Order GPUs' });
    await openProject(page, project);
    return page.locator('.task').first();
  }

  async function setOwner(page, task, name) {
    const saved = waitForSave(page, '/tasks/');
    const field = task.getByLabel('Owner');
    await field.fill(name);
    await field.press('Enter');
    await saved;
  }

  test('typing shows matching members; tapping one saves it', async ({ page }, testInfo) => {
    const errors = collectPageErrors(page);
    const task = await boardWithOneTask(page, testInfo);
    await task.getByLabel('Owner').fill('e2e');
    const option = task.getByRole('option', { name: 'E2E Tester' });
    await expect(option).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath('suggestions.png') });

    const saved = waitForSave(page, '/tasks/');
    await option.click();
    await saved;
    await expect(task.getByRole('listbox')).toHaveCount(0);
    await page.reload();
    await expect(task.getByLabel('Owner')).toHaveValue('E2E Tester');
    // Linked member → coloured pill.
    await expect(task.locator('.owner-wrap')).toHaveAttribute('style', /--o:/);
    expect(errors).toEqual([]);
  });

  test('arrow down + Enter picks the highlighted name, saved once', async ({ page }, testInfo) => {
    const task = await boardWithOneTask(page, testInfo);
    const patches = [];
    page.on('request', (r) => { if (r.method() === 'PATCH' && r.url().includes('/tasks/')) patches.push(r.postDataJSON()); });
    const field = task.getByLabel('Owner');
    await field.fill('e2e');
    await field.press('ArrowDown');
    const saved = waitForSave(page, '/tasks/');
    await field.press('Enter');
    await saved;
    await page.waitForTimeout(500);
    expect(patches).toEqual([{ owner: 'E2E Tester' }]);
  });

  test('typing a member name in full links the member', async ({ page }, testInfo) => {
    const errors = collectPageErrors(page);
    const task = await boardWithOneTask(page, testInfo);
    await setOwner(page, task, 'e2e tester');
    await page.reload();
    await expect(task.getByLabel('Owner')).toHaveValue('E2E Tester');
    // Linked member → coloured pill.
    await expect(task.locator('.owner-wrap')).toHaveAttribute('style', /--o:/);
    expect(errors).toEqual([]);
  });

  test("a non-member's name is kept, suggested later, filterable and grouped", async ({ page }, testInfo) => {
    const errors = collectPageErrors(page);
    const task = await boardWithOneTask(page, testInfo);

    await setOwner(page, task, 'Dana from Legal');
    await page.reload();
    await expect(task.getByLabel('Owner')).toHaveValue('Dana from Legal');
    await expect(task.locator('.owner-wrap')).not.toHaveAttribute('style', /--o:/);

    // Now suggested on other tasks' owner fields too (same board).
    await task.getByLabel('Owner').fill('dan');
    await expect(task.getByRole('option', { name: 'Dana from Legal' })).toBeVisible();
    await task.getByLabel('Owner').fill('Dana from Legal');
    await task.getByLabel('Owner').blur();

    await page.getByLabel('Filter by owner').selectOption({ label: 'Dana from Legal' });
    await expect(page.locator('.task')).toHaveCount(1);
    await page.getByLabel('Filter by owner').selectOption({ label: 'All owners' });

    await page.getByRole('button', { name: 'By owner' }).click();
    await expect(page.locator('.divider-owner b', { hasText: 'Dana from Legal' })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath('owner-view.png') });

    // Clearing the field unassigns.
    await page.getByRole('button', { name: 'By topic' }).click();
    await setOwner(page, task, '');
    await page.reload();
    await expect(task.getByLabel('Owner')).toHaveValue('');
    expect(errors).toEqual([]);
  });
});

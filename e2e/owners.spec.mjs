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

  test('members are suggested and typing one links the member', async ({ page }, testInfo) => {
    const errors = collectPageErrors(page);
    const task = await boardWithOneTask(page, testInfo);
    const listId = await task.getByLabel('Owner').getAttribute('list');
    await expect(page.locator(`datalist#${listId} option[value="E2E Tester"]`)).toHaveCount(1);

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

    const listId = await task.getByLabel('Owner').getAttribute('list');
    await expect(page.locator(`datalist#${listId} option[value="Dana from Legal"]`)).toHaveCount(1);

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

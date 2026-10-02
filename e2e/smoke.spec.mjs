// Smoke: the net under every tier — dashboard, build a board, update status, add a note, search.
// Everything typed or changed must survive a reload (the app's core promise).
import { test, expect } from '@playwright/test';
import { dataTracker, uniquePrefix, openProject, waitForSave, collectPageErrors } from './helpers.mjs';

test.describe('smoke', () => {
  let data;
  test.beforeEach(async ({ request }) => { data = dataTracker(request); });
  test.afterEach(async () => { await data.cleanup(); });

  test('dashboard lists a project and opens it', async ({ page }, testInfo) => {
    const errors = collectPageErrors(page);
    const project = await data.project(uniquePrefix(testInfo.title));

    await page.goto('/dashboard');
    await page.getByRole('heading', { name: project.title, level: 2, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/project/${project.id}`));
    await expect(page.getByRole('heading', { name: project.title, level: 1, exact: true })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath('board.png') });
    expect(errors).toEqual([]);
  });

  test('add a workstream and a task, change status, add a note — all survive reload', async ({ page }, testInfo) => {
    const errors = collectPageErrors(page);
    const project = await data.project(uniquePrefix(testInfo.title));
    await openProject(page, project);

    await page.getByLabel('New workstream name').fill('Launch');
    await page.getByRole('button', { name: 'Add workstream' }).click();
    await expect(page.getByRole('heading', { name: 'Launch', level: 2 })).toBeVisible();

    const created = waitForSave(page, '/tasks', 'POST');
    await page.getByLabel('New task').fill('Sign the lease');
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await created;
    const task = page.locator('.task');
    await expect(task).toHaveCount(1);
    await expect(task.getByLabel('Task title')).toHaveValue('Sign the lease');

    const saved = waitForSave(page, '/tasks/');
    await task.getByLabel('Status').selectOption('progress');
    await saved;

    const noteCreated = waitForSave(page, '/notes', 'POST');
    await task.getByRole('button', { name: '+ Note' }).click();
    await noteCreated;
    const note = task.getByPlaceholder('Write a note');
    await note.fill('Landlord wants a second guarantor');
    const noteSaved = waitForSave(page, '/notes/');
    await note.blur();
    await noteSaved;

    await page.reload();
    await expect(task.getByLabel('Task title')).toHaveValue('Sign the lease');
    await expect(task.getByLabel('Status')).toHaveValue('progress');
    await expect(task.getByPlaceholder('Write a note')).toHaveValue('Landlord wants a second guarantor');
    await page.screenshot({ path: testInfo.outputPath('after-reload.png') });
    expect(errors).toEqual([]);
  });

  test('mark done with the tick and search narrows the board', async ({ page }, testInfo) => {
    const errors = collectPageErrors(page);
    const project = await data.project(uniquePrefix(testInfo.title));
    const section = await data.section(project.id, 'Ops');
    await data.task(project.id, { sectionId: section.id, title: 'Order GPUs' });
    await data.task(project.id, { sectionId: section.id, title: 'Hire a technician' });
    await openProject(page, project);
    await expect(page.locator('.task')).toHaveCount(2);

    const first = page.locator('.task').first();
    const saved = waitForSave(page, '/tasks/');
    await first.getByRole('button', { name: 'Mark done' }).click();
    await saved;
    await expect(first.getByRole('button', { name: 'Mark done' })).toHaveAttribute('aria-pressed', 'true');

    await page.getByLabel('Search tasks').fill('technician');
    await expect(page.locator('.task')).toHaveCount(1);
    await expect(page.locator('.task').getByLabel('Task title')).toHaveValue('Hire a technician');
    await page.screenshot({ path: testInfo.outputPath('search.png') });
    expect(errors).toEqual([]);
  });
});

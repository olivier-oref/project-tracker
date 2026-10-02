// Shared e2e helpers: unique names, API-only test data with cleanup, crash detection, dialogs.
import { expect } from '@playwright/test';

let counter = 0;
/** Unique, search-friendly prefix per test run (random part: workers are separate processes). */
export function uniquePrefix(title) {
  counter += 1;
  return `E2E ${title.replace(/[^a-z0-9]+/gi, ' ').trim().slice(0, 24)} ${Date.now().toString(36)}${counter}${Math.random().toString(36).slice(2, 6)}`;
}

/** Creates projects (and their contents) via the app API and deletes the projects in cleanup(). */
export function dataTracker(request) {
  const projectIds = [];
  const post = async (url, data) => {
    const res = await request.post(url, { data });
    expect(res.ok(), `POST ${url}: ${await res.text()}`).toBeTruthy();
    return res.json();
  };
  return {
    async project(title, subtitle) {
      const row = await post('/api/projects', { title, subtitle });
      projectIds.push(row.id);
      return row;
    },
    section: (projectId, title) => post(`/api/projects/${projectId}/sections`, { title }),
    task: (projectId, body) => post(`/api/projects/${projectId}/tasks`, body),
    note: (projectId, taskId, content) => post(`/api/projects/${projectId}/notes`, { taskId, content }),
    async cleanup() {
      for (const id of projectIds.splice(0)) await request.delete(`/api/projects/${id}`);
    },
  };
}

/** Opens a project board and waits for its title. */
export async function openProject(page, project) {
  await page.goto(`/project/${project.id}`);
  await expect(page.getByRole('heading', { name: project.title, level: 1, exact: true })).toBeVisible();
}

/** Waits for the next PATCH/POST the board sends to the given API path fragment. */
export function waitForSave(page, pathFragment, method = 'PATCH') {
  return page.waitForResponse((r) => r.url().includes(pathFragment) && r.request().method() === method && r.ok());
}

/** Records dialogs and answers them with `answer` ('accept' | 'dismiss'); returns the log. */
export function handleDialogs(page, answer = 'dismiss') {
  const log = { messages: [], answer };
  page.on('dialog', async (d) => {
    log.messages.push(d.message());
    if (log.answer === 'accept') await d.accept(); else await d.dismiss();
  });
  return log;
}

/** Collects uncaught page exceptions (crash detection); assert the array is empty at the end. */
export function collectPageErrors(page) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  return errors;
}

// The phase route rewrites tasks in bulk: rejected requests must write nothing. The SQL itself
// (CASE rewrite, project scoping, swaps) is exercised against a real database in e2e/phases.spec.mjs.
const mockVerify = jest.fn();
const selectResults: unknown[][] = [];
const writes: string[] = [];

jest.mock("@/lib/project-auth", () => ({ verifyProjectMembership: () => mockVerify() }));
jest.mock("@/lib/db", () => ({
  db: {
    select: () => ({ from: () => ({ where: async () => selectResults.shift() ?? [] }) }),
    update: () => {
      writes.push("update");
      return { set: () => ({ where: () => ({ returning: async () => [{ phases: ["SF", "NYC"] }] }) }) };
    },
    batch: async () => {
      writes.push("batch");
      return [];
    },
  },
}));

import { PUT } from "./route";

const params = { params: Promise.resolve({ projectId: "p1" }) };
const put = (body: unknown) =>
  PUT(new Request("http://test/api/projects/p1/phases", { method: "PUT", body: JSON.stringify(body) }), params);

beforeEach(() => {
  selectResults.length = 0;
  writes.length = 0;
  mockVerify.mockReset().mockResolvedValue({ membership: { role: "member" }, userId: "u1" });
});

it("non-members get the membership error and nothing is written", async () => {
  mockVerify.mockResolvedValue({ error: "Forbidden", status: 403 });
  expect((await put({ phases: ["SF"] })).status).toBe(403);
  expect(writes).toEqual([]);
});

it("404 for a missing project", async () => {
  selectResults.push([]);
  expect((await put({ phases: ["SF"] })).status).toBe(404);
  expect(writes).toEqual([]);
});

it.each([
  [{ phases: ["SF", "sf"] }],
  [{ phases: "SF" }],
  [{ phases: ["SF"], renames: { Paris: "SF" } }],
  [null],
])("invalid body %j → 400, nothing written", async (body) => {
  selectResults.push([{ phases: ["SF"] }]);
  expect((await put(body)).status).toBe(400);
  expect(writes).toEqual([]);
});

it("adding a phase saves the list without rewriting tasks", async () => {
  selectResults.push([{ phases: ["SF"] }]);
  const res = await put({ phases: ["SF", "NYC"] });
  expect(res.status).toBe(200);
  expect(writes).toEqual(["update"]);
});

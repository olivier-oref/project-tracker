// Task PATCH writes user data: test what gets written (owner resolution) and that rejected
// requests never touch the project (issue #6).
const selectResults: unknown[][] = [];
const updates: Record<string, unknown>[] = [];
const mockVerify = jest.fn();
const mockTouch = jest.fn();

jest.mock("@/lib/project-auth", () => ({
  verifyProjectMembership: () => mockVerify(),
  touchProject: (id: string) => mockTouch(id),
}));
jest.mock("@/lib/db", () => {
  const where = async () => selectResults.shift() ?? [];
  const from = () => ({ where, innerJoin: () => ({ where }) });
  return {
    db: {
      select: () => ({ from }),
      update: () => ({
        set: (values: Record<string, unknown>) => {
          updates.push(values);
          return { where: () => ({ returning: async () => [{ id: "t1", ...values }] }) };
        },
      }),
    },
  };
});

import { PATCH } from "./route";

const params = { params: Promise.resolve({ projectId: "p1", taskId: "t1" }) };
const patch = (body: unknown) =>
  PATCH(new Request("http://test/api/projects/p1/tasks/t1", { method: "PATCH", body: JSON.stringify(body) }), params);
const taskRow = [{ task: { id: "t1", sectionId: "s1" }, section: { id: "s1", projectId: "p1" } }];
const memberRows = [{ id: "u1", name: "Olivier Marschalik", email: "o@x.com" }, { id: "u2", name: null, email: "felipe@x.com" }];

beforeEach(() => {
  selectResults.length = 0;
  updates.length = 0;
  mockVerify.mockReset().mockResolvedValue({ membership: { role: "member" }, userId: "u1" });
  mockTouch.mockReset().mockResolvedValue(undefined);
});

describe("PATCH task owner", () => {
  it("links a member typed by name (any case) and clears the free-text name", async () => {
    selectResults.push(taskRow, memberRows);
    const res = await patch({ owner: "olivier marschalik" });
    expect(res.status).toBe(200);
    expect(updates[0]).toMatchObject({ ownerId: "u1", ownerName: null });
  });

  it("matches a member without a profile name by their email prefix", async () => {
    selectResults.push(taskRow, memberRows);
    await patch({ owner: "Felipe" });
    expect(updates[0]).toMatchObject({ ownerId: "u2", ownerName: null });
  });

  it("keeps a non-member name as typed and clears the member link", async () => {
    selectResults.push(taskRow, memberRows);
    await patch({ owner: " Dana from Legal " });
    expect(updates[0]).toMatchObject({ ownerId: null, ownerName: "Dana from Legal" });
  });

  it("clears both for an empty owner", async () => {
    selectResults.push(taskRow, memberRows);
    await patch({ owner: "" });
    expect(updates[0]).toMatchObject({ ownerId: null, ownerName: null });
  });

  it("legacy ownerId still works and clears any free-text name", async () => {
    selectResults.push(taskRow);
    await patch({ ownerId: "u2" });
    expect(updates[0]).toMatchObject({ ownerId: "u2", ownerName: null });
  });

  it("leaves the owner alone when the body has no owner fields", async () => {
    selectResults.push(taskRow);
    await patch({ status: "done" });
    expect(updates[0]).not.toHaveProperty("ownerId");
    expect(updates[0]).not.toHaveProperty("ownerName");
  });

  it("touches the project once after a successful write", async () => {
    selectResults.push(taskRow);
    await patch({ status: "done" });
    expect(mockTouch).toHaveBeenCalledTimes(1);
    expect(mockTouch).toHaveBeenCalledWith("p1");
  });
});

describe("rejected requests never touch the project (#6)", () => {
  it("401/403 from the membership check", async () => {
    mockVerify.mockResolvedValue({ error: "Unauthorized", status: 401 });
    expect((await patch({ status: "done" })).status).toBe(401);
    expect(mockTouch).not.toHaveBeenCalled();
    expect(updates).toEqual([]);
  });

  it("404 for a task outside the project", async () => {
    selectResults.push([]);
    expect((await patch({ status: "done" })).status).toBe(404);
    expect(mockTouch).not.toHaveBeenCalled();
  });

  it("400 for an empty title or invalid sortOrder", async () => {
    selectResults.push(taskRow);
    expect((await patch({ title: "  " })).status).toBe(400);
    selectResults.push(taskRow);
    expect((await patch({ sortOrder: "x" })).status).toBe(400);
    expect(mockTouch).not.toHaveBeenCalled();
    expect(updates).toEqual([]);
  });
});

// Signup writes users and claims invites, so test the route's writes, not just the rules.
const selectResults: unknown[][] = [];
const writes: { op: string; values?: unknown }[] = [];

jest.mock("bcryptjs", () => ({ hash: async (p: string) => `hashed:${p}` }));
jest.mock("@/lib/db", () => ({
  db: {
    select: () => ({ from: () => ({ where: async () => selectResults.shift() ?? [] }) }),
    insert: () => ({
      values: (values: unknown) => {
        writes.push({ op: "insert", values });
        return { returning: async () => [{ id: "new-user" }] };
      },
    }),
    update: () => ({
      set: (values: unknown) => {
        writes.push({ op: "update", values });
        return { where: async () => undefined };
      },
    }),
  },
}));

import { POST } from "./route";

const signup = (body: unknown) =>
  POST(new Request("http://test/api/auth/signup", { method: "POST", body: JSON.stringify(body) }));
const valid = { email: "New@Example.com", password: "password1", name: "New" };

beforeEach(() => {
  selectResults.length = 0;
  writes.length = 0;
});

describe("POST /api/auth/signup", () => {
  it("400s on invalid input without touching the database", async () => {
    const res = await signup({ email: "a@b.c", password: "short", name: "A" });
    expect(res.status).toBe(400);
    expect(writes).toEqual([]);
  });

  it("403s an uninvited new email and writes nothing", async () => {
    selectResults.push([], []); // no user, no invite
    const res = await signup(valid);
    expect(res.status).toBe(403);
    expect(writes).toEqual([]);
  });

  it("409s when the account already has a password", async () => {
    selectResults.push([{ id: "u1", passwordHash: "x" }]);
    expect((await signup(valid)).status).toBe(409);
    expect(writes).toEqual([]);
  });

  it("creates an invited user with a hashed password and claims the invites", async () => {
    selectResults.push([], [{ email: "new@example.com" }]);
    const res = await signup(valid);
    expect(res.status).toBe(200);
    expect(writes[0]).toEqual({
      op: "insert",
      values: { email: "new@example.com", name: "New", passwordHash: "hashed:password1" },
    });
    expect(writes[1]).toMatchObject({ op: "update", values: { userId: "new-user" } });
    expect(writes).toHaveLength(2);
  });

  it("sets the password on a passwordless (Google) account without creating a user", async () => {
    selectResults.push([{ id: "u1", passwordHash: null }]);
    expect((await signup(valid)).status).toBe(200);
    expect(writes).toEqual([{ op: "update", values: { name: "New", passwordHash: "hashed:password1" } }]);
  });
});

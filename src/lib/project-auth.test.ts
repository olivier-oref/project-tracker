const mockAuth = jest.fn();
const mockWhere = jest.fn();

jest.mock("@/lib/auth", () => ({ auth: () => mockAuth() }));
jest.mock("@/lib/db", () => ({
  db: { select: () => ({ from: () => ({ where: mockWhere }) }) },
}));

import { verifyProjectMembership } from "./project-auth";

beforeEach(() => {
  mockAuth.mockReset();
  mockWhere.mockReset();
});

describe("verifyProjectMembership", () => {
  it("returns 401 without a signed-in user and never queries membership", async () => {
    mockAuth.mockResolvedValue(null);
    expect(await verifyProjectMembership("p1")).toEqual({ error: "Unauthorized", status: 401 });
    mockAuth.mockResolvedValue({ user: {} });
    expect(await verifyProjectMembership("p1")).toEqual({ error: "Unauthorized", status: 401 });
    expect(mockWhere).not.toHaveBeenCalled();
  });

  it("returns 403 when the user is not a member of the project", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1" } });
    mockWhere.mockResolvedValue([]);
    expect(await verifyProjectMembership("p1")).toEqual({ error: "Forbidden", status: 403 });
  });

  it("returns the session, membership and user id for a member", async () => {
    const session = { user: { id: "u1" } };
    const membership = { projectId: "p1", userId: "u1", role: "owner" };
    mockAuth.mockResolvedValue(session);
    mockWhere.mockResolvedValue([membership]);
    expect(await verifyProjectMembership("p1")).toEqual({ session, membership, userId: "u1" });
  });
});

import { parseSignupBody, mayJoin, signupAction } from "./signup-rules";

describe("parseSignupBody", () => {
  it("normalises email and trims name", () => {
    expect(parseSignupBody({ email: "  Ann@Example.COM ", password: "longenough", name: " Ann " }))
      .toEqual({ email: "ann@example.com", password: "longenough", name: "Ann" });
  });

  it("requires every field, including whitespace-only ones", () => {
    for (const body of [
      { password: "longenough", name: "Ann" },
      { email: "a@b.c", name: "Ann" },
      { email: "a@b.c", password: "longenough", name: "   " },
      { email: 42, password: "longenough", name: "Ann" },
      null,
    ]) {
      expect(parseSignupBody(body)).toEqual({ error: "Name, email, and password are required", status: 400 });
    }
  });

  it("rejects passwords under 8 characters, accepts exactly 8", () => {
    expect(parseSignupBody({ email: "a@b.c", password: "1234567", name: "A" }))
      .toEqual({ error: "Password must be at least 8 characters", status: 400 });
    expect(parseSignupBody({ email: "a@b.c", password: "12345678", name: "A" })).not.toHaveProperty("error");
  });
});

describe("mayJoin", () => {
  it("lets existing users and invited people in, refuses everyone else", () => {
    expect(mayJoin({ id: "u1" }, undefined)).toBe(true);
    expect(mayJoin(undefined, { email: "a@b.c" })).toBe(true);
    expect(mayJoin(undefined, undefined)).toBe(false);
  });
});

describe("signupAction", () => {
  it("conflicts when the account already has a password, even if invited", () => {
    expect(signupAction({ passwordHash: "h" }, { email: "x" })).toEqual({ kind: "conflict" });
  });
  it("sets a password on a passwordless (Google) account", () => {
    expect(signupAction({ passwordHash: null }, undefined)).toEqual({ kind: "set_password" });
  });
  it("creates only for invited new users", () => {
    expect(signupAction(undefined, { email: "x" })).toEqual({ kind: "create" });
    expect(signupAction(undefined, undefined)).toEqual({ kind: "not_invited" });
  });
});

// Invite-only registration rules, shared by email signup and Google sign-in.

export type SignupInput = { email: string; password: string; name: string };
export type SignupError = { error: string; status: 400 };

export function parseSignupBody(body: unknown): SignupInput | SignupError {
  const b = (body ?? {}) as Record<string, unknown>;
  const email = typeof b.email === "string" ? b.email.trim().toLowerCase() : "";
  const password = typeof b.password === "string" ? b.password : "";
  const name = typeof b.name === "string" ? b.name.trim() : "";

  if (!email || !password || !name) {
    return { error: "Name, email, and password are required", status: 400 };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters", status: 400 };
  }
  return { email, password, name };
}

/** A new person may join only with a pending invite; an existing user always may. */
export function mayJoin(existingUser: unknown, invite: unknown): boolean {
  return Boolean(existingUser) || Boolean(invite);
}

export type SignupAction =
  | { kind: "conflict" }
  | { kind: "not_invited" }
  | { kind: "set_password" }
  | { kind: "create" };

/**
 * What email signup does for this address:
 * - an account with a password already exists → conflict
 * - a passwordless account (created via Google) → set its password
 * - no account and no invite → refuse
 * - no account, invited → create it and claim the invites
 */
export function signupAction(
  existingUser: { passwordHash: string | null } | undefined,
  invite: unknown
): SignupAction {
  if (existingUser?.passwordHash) return { kind: "conflict" };
  if (existingUser) return { kind: "set_password" };
  return mayJoin(existingUser, invite) ? { kind: "create" } : { kind: "not_invited" };
}

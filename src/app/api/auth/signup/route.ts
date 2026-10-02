import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { eq, and, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { parseSignupBody, signupAction } from "@/lib/signup-rules";
import { users, projectMembers } from "../../../../../drizzle/schema";

export async function POST(request: Request) {
  const parsed = parseSignupBody(await request.json());
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: parsed.status });
  }
  const { email, password, name } = parsed;

  const [existing] = await db.select().from(users).where(eq(users.email, email));

  const [invite] = existing
    ? []
    : await db.select().from(projectMembers).where(eq(projectMembers.email, email));

  const action = signupAction(existing, invite);

  if (action.kind === "conflict") {
    return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
  }
  if (action.kind === "not_invited") {
    return NextResponse.json({ error: "Registration is by invitation only. Ask a project owner to invite you." }, { status: 403 });
  }

  const passwordHash = await hash(password, 12);

  if (action.kind === "set_password") {
    await db.update(users).set({ name, passwordHash }).where(eq(users.id, existing.id));
  } else {
    const [newUser] = await db
      .insert(users)
      .values({ email, name, passwordHash })
      .returning();

    await db
      .update(projectMembers)
      .set({ userId: newUser.id, joinedAt: new Date() })
      .where(
        and(
          eq(projectMembers.email, email),
          isNull(projectMembers.userId),
          isNull(projectMembers.joinedAt)
        )
      );
  }

  return NextResponse.json({ success: true });
}

import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { eq, and, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, projectMembers } from "../../../../../drizzle/schema";

export async function POST(request: Request) {
  const body = await request.json();
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";

  if (!email || !password || !name) {
    return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const [existing] = await db.select().from(users).where(eq(users.email, email));

  if (existing?.passwordHash) {
    return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
  }

  const passwordHash = await hash(password, 12);

  if (existing) {
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

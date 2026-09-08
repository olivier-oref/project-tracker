import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { eq, and, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, projectMembers } from "../../drizzle/schema";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google,
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = typeof credentials?.email === "string" ? credentials.email.trim().toLowerCase() : "";
        const password = typeof credentials?.password === "string" ? credentials.password : "";
        if (!email || !password) return null;

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email));

        if (!user || !user.passwordHash) return null;

        const valid = await compare(password, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.name, image: user.avatarUrl };
      },
    }),
  ],
  pages: {
    signIn: "/auth/signin",
  },
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;

      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, user.email));

      if (!existingUser) {
        const [invite] = await db
          .select()
          .from(projectMembers)
          .where(eq(projectMembers.email, user.email));
        if (!invite) return false;
      }

      const dbUser =
        existingUser ??
        (
          await db
            .insert(users)
            .values({
              email: user.email,
              name: user.name ?? user.email,
              avatarUrl: user.image,
            })
            .returning()
        )[0];

      await db
        .update(projectMembers)
        .set({ userId: dbUser.id, joinedAt: new Date() })
        .where(
          and(
            eq(projectMembers.email, user.email),
            isNull(projectMembers.joinedAt)
          )
        );

      return true;
    },
    async jwt({ token }) {
      if (token.email) {
        const [dbUser] = await db
          .select()
          .from(users)
          .where(eq(users.email, token.email));

        if (dbUser) token.userId = dbUser.id;
      }

      return token;
    },
    async session({ session, token }) {
      if (token.userId) session.user.id = token.userId as string;
      return session;
    },
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const isAuthPage = request.nextUrl.pathname.startsWith("/api/auth") ||
        request.nextUrl.pathname.startsWith("/auth/");
      if (isAuthPage) return true;
      return isLoggedIn;
    },
  },
});

import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { eq, and, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, projectMembers } from "../../drizzle/schema";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;

      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, user.email));

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
            isNull(projectMembers.userId),
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
      const isAuthPage = request.nextUrl.pathname.startsWith("/api/auth");
      if (isAuthPage) return true;
      return isLoggedIn;
    },
  },
});

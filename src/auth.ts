import NextAuth, { CredentialsSignin } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./lib/prisma";
import { authenticateAccount } from "./lib/account-service";
import { credentialsSchema } from "./lib/validation";
import { sessionIsCurrent } from "./lib/password-reset-service";
class RateLimited extends CredentialsSignin {
  code = "rateLimited";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        if (!process.env.AUTH_SECRET) return null;
        const result = await authenticateAccount(
          prisma,
          parsed.data.email,
          parsed.data.password,
          process.env.AUTH_SECRET,
        );
        if (result.limited) throw new RateLimited();
        return result.user;
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.sessionVersion =
          "sessionVersion" in user ? user.sessionVersion : 0;
      }
      if (
        !token.sub ||
        !(await sessionIsCurrent(prisma, token.sub, token.sessionVersion))
      )
        return null;
      return token;
    },
  },
});

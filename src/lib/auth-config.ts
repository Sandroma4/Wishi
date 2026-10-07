import type { NextAuthConfig } from "next-auth";
import { CredentialsSignin } from "@auth/core/errors";
import { decode } from "@auth/core/jwt";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { PrismaClient } from "@wishi/prisma-client";
import { googleAuthEnabled, googleProfileAllowed } from "./google-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { authenticateAccount } from "./account-service";
import { credentialsSchema } from "./validation";
import { sessionIsCurrent } from "./password-reset-service";
class RateLimited extends CredentialsSignin {
  code = "rateLimited";
}

export function createAuthConfig(
  prisma: PrismaClient,
  env: NodeJS.ProcessEnv = process.env,
): NextAuthConfig {
  return {
    basePath: "/api/auth",
    trustHost: Boolean(
      env.AUTH_URL ||
        env.AUTH_TRUST_HOST === "true" ||
        env.NODE_ENV !== "production",
    ),
    secret: env.AUTH_SECRET,
    adapter: PrismaAdapter(prisma),
    pages: { signIn: "/api/auth/error", error: "/api/auth/error" },
    session: { strategy: "jwt" },
    jwt: {
      async decode(params) {
        const token = await decode(params);
        return token?.sub &&
          (await sessionIsCurrent(prisma, token.sub, token.sessionVersion))
          ? token
          : null;
      },
    },
    providers: [
      ...(googleAuthEnabled(env)
        ? [
            Google({
              clientId: env.AUTH_GOOGLE_ID,
              clientSecret: env.AUTH_GOOGLE_SECRET,
              profile(profile) {
                return {
                  id: profile.sub,
                  name: profile.name,
                  email: profile.email?.trim().toLowerCase(),
                  image: profile.picture,
                };
              },
              authorization: {
                params: {
                  scope: "openid email profile",
                  prompt: "select_account",
                },
              },
            }),
          ]
        : []),
      CredentialsProvider({
        name: "Credentials",
        credentials: {
          email: { label: "Email", type: "email" },
          password: { label: "Password", type: "password" },
        },
        async authorize(credentials) {
          const parsed = credentialsSchema.safeParse(credentials);
          if (!parsed.success) return null;

          if (!env.AUTH_SECRET) return null;
          const result = await authenticateAccount(
            prisma,
            parsed.data.email,
            parsed.data.password,
            env.AUTH_SECRET,
          );
          if (result.limited) throw new RateLimited();
          return result.user;
        },
      }),
    ],
    callbacks: {
      async signIn({ account, profile }) {
        return account?.provider !== "google" || googleProfileAllowed(profile);
      },
      async session({ session, token }) {
        if (token.sub && session.user) {
          session.user.id = token.sub;
        }
        return session;
      },
      async jwt({ token, user }) {
        if (user) {
          token.sub = user.id;
          const current = await prisma.user.findUnique({
            where: { id: user.id },
            select: { sessionVersion: true },
          });
          if (!current) return null;
          token.sessionVersion = current.sessionVersion;
        }
        if (
          !token.sub ||
          !(await sessionIsCurrent(prisma, token.sub, token.sessionVersion))
        )
          return null;
        return token;
      },
    },
  };
}

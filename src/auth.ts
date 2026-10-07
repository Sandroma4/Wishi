import NextAuth from "next-auth";
import { prisma } from "./lib/prisma";
import { createAuthConfig } from "./lib/auth-config";
export const { handlers, auth, signIn, signOut } = NextAuth(
  createAuthConfig(prisma),
);

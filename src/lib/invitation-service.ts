import type { PrismaClient } from "@wishi/prisma-client";
import { randomBytes } from "node:crypto";
export async function pendingInvitations(
  db: PrismaClient,
  familyId: string,
  userId: string,
) {
  return db.invitation.findMany({
    where: {
      familyId,
      expires: { gt: new Date() },
      family: { members: { some: { userId, role: "ADMIN" } } },
    },
    select: { id: true, email: true, token: true, expires: true },
    orderBy: { createdAt: "desc" },
  });
}
export async function revokeInvitation(
  db: PrismaClient,
  id: string,
  userId: string,
) {
  const deleted = await db.invitation.deleteMany({
    where: { id, family: { members: { some: { userId, role: "ADMIN" } } } },
  });
  return deleted.count ? { success: true } : { error: "forbidden" };
}
export async function issueInvitation(
  db: PrismaClient,
  familyId: string,
  email: string,
  userId: string,
) {
  return db.$transaction(async (tx) => {
    const admin = await tx.familyMember.findUnique({
      where: { userId_familyId: { userId, familyId } },
      select: { role: true },
    });
    if (admin?.role !== "ADMIN") return { error: "forbidden" };
    if (
      await tx.familyMember.findFirst({
        where: { familyId, user: { email } },
        select: { id: true },
      })
    )
      return { error: "alreadyMember" };
    await tx.invitation.deleteMany({ where: { familyId, email } });
    const invitation = await tx.invitation.create({
      data: {
        email,
        familyId,
        token: randomBytes(32).toString("hex"),
        expires: new Date(Date.now() + 7 * 86400000),
      },
    });
    return { success: true, token: invitation.token };
  });
}
export async function joinFamily(
  db: PrismaClient,
  token: string,
  user: { id: string; email: string | null },
) {
  return db.$transaction(async (tx) => {
    const invitation = await tx.invitation.findUnique({ where: { token } });
    if (!invitation || invitation.expires <= new Date())
      return { error: "invalidInvitation" };
    if (
      !user.email ||
      invitation.email.toLowerCase() !== user.email.toLowerCase()
    )
      return { error: "wrongEmail" };
    await tx.familyMember.upsert({
      where: {
        userId_familyId: { userId: user.id, familyId: invitation.familyId },
      },
      create: {
        userId: user.id,
        familyId: invitation.familyId,
        role: "MEMBER",
      },
      update: {},
    });
    await tx.invitation.delete({ where: { id: invitation.id } });
    return { success: true, familyId: invitation.familyId };
  });
}

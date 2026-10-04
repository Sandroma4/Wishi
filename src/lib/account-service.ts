import type { PrismaClient } from "@wishi/prisma-client";
import { createHmac } from "node:crypto";
import bcrypt from "bcryptjs";
import { passwordSchema } from "./validation";

export async function allowAccountAttempt(
  db: PrismaClient,
  purpose: string,
  identity: string,
  secret: string,
  limit = 10,
  minutes = 15,
  now = new Date(),
) {
  const bucket = Math.floor(now.getTime() / (minutes * 60_000));
  await db.authRequestThrottle.deleteMany({
    where: { windowStart: { lt: new Date(now.getTime() - 24 * 60 * 60_000) } },
  });
  const key = `${purpose}:${createHmac("sha256", secret).update(identity).digest("hex")}:${bucket}`;
  const entry = await db.authRequestThrottle.upsert({
    where: { key },
    create: { key, windowStart: now, attempts: 1 },
    update: { attempts: { increment: 1 } },
  });
  return entry.attempts <= limit;
}
export async function authenticateAccount(
  db: PrismaClient,
  email: string,
  password: string,
  secret: string,
) {
  if (
    !(await allowAccountAttempt(db, "login-global", "all", secret, 1000)) ||
    !(await allowAccountAttempt(db, "login", email, secret))
  )
    return { limited: true, user: null };
  const user = await db.user.findUnique({ where: { email } });
  if (!user?.password || !(await bcrypt.compare(password, user.password)))
    return { limited: false, user: null };
  return { limited: false, user };
}
export async function changeAccountPassword(
  db: PrismaClient,
  userId: string,
  currentPassword: string,
  newPassword: string,
  secret: string,
) {
  if (
    !passwordSchema.safeParse(newPassword).success ||
    !currentPassword ||
    currentPassword.length > 128
  )
    return { error: "invalidFields" };
  if (!(await allowAccountAttempt(db, "change-password", userId, secret)))
    return { error: "rateLimited" };
  const user = await db.user.findUnique({ where: { id: userId } });
  if (
    !user?.password ||
    !(await bcrypt.compare(currentPassword, user.password))
  )
    return { error: "wrongPassword" };
  if (currentPassword === newPassword) return { error: "samePassword" };
  const password = await bcrypt.hash(newPassword, 12);
  return db.$transaction(async (tx) => {
    const updated = await tx.user.updateMany({
      where: {
        id: userId,
        password: user.password,
        sessionVersion: user.sessionVersion,
      },
      data: { password, sessionVersion: { increment: 1 } },
    });
    if (!updated.count) return { error: "unauthorized" };
    await tx.passwordResetToken.deleteMany({ where: { userId } });
    return { success: true };
  });
}

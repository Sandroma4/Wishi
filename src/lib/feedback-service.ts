import type { PrismaClient } from "@wishi/prisma-client";
import { z } from "zod";
import { allowAccountAttempt } from "./account-service";
export async function submitFeedback(
  db: PrismaClient,
  userId: string,
  category: string,
  message: string,
  secret: string,
) {
  const parsed = z
    .object({
      category: z.enum(["BUG", "IDEA", "OTHER"]),
      message: z.string().trim().min(10).max(2000),
    })
    .safeParse({ category, message });
  if (!parsed.success) return { error: "invalidFields" };
  if (!(await allowAccountAttempt(db, "feedback", userId, secret, 5, 60)))
    return { error: "rateLimited" };
  const report = await db.feedback.create({ data: { userId, ...parsed.data } });
  return { success: true, id: report.id };
}

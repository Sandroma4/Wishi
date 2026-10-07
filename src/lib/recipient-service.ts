import type { PrismaClient } from "@wishi/prisma-client";
type Change =
  | { operation: "rename"; name: string }
  | { operation: "delete" }
  | { operation: "merge"; targetId: string };
export async function manageRecipient(
  db: PrismaClient,
  userId: string,
  id: string,
  change: Change,
) {
  if (
    change.operation === "rename" &&
    (!change.name.trim() || change.name.trim().length > 120)
  )
    return { error: "invalidFields" };
  return db.$transaction(async (tx) => {
    if (
      !(await tx.recipient.findFirst({
        where: { id, ownerId: userId },
        select: { id: true },
      }))
    )
      return { error: "forbidden" };
    if (change.operation === "rename")
      await tx.recipient.update({
        where: { id },
        data: { name: change.name.trim() },
      });
    else {
      if (change.operation === "merge") {
        if (
          change.targetId === id ||
          !(await tx.recipient.findFirst({
            where: { id: change.targetId, ownerId: userId },
            select: { id: true },
          }))
        )
          return { error: "forbidden" };
        await tx.wishlist.updateMany({
          where: { recipientId: id, ownerId: userId },
          data: { recipientId: change.targetId },
        });
      }
      await tx.recipient.delete({ where: { id } });
    }
    return { success: true };
  });
}

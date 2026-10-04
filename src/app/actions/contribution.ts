"use server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { contributeGift, cancelContribution } from "@/lib/contribution-service";
import { refreshWishlists } from "@/lib/refresh";
export async function saveContribution(
  itemId: string,
  amount: string,
  token?: string,
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "unauthorized" };
  if (!/^\d{1,7}(?:\.\d{1,2})?$/.test(amount))
    return { error: "invalidFields" };
  const result = await contributeGift(
    prisma,
    itemId,
    session.user.id,
    Math.round(Number(amount) * 100),
    token,
  );
  refreshWishlists();
  return result;
}
export async function removeContribution(itemId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "unauthorized" };
  const result = await cancelContribution(prisma, itemId, session.user.id);
  refreshWishlists();
  return result;
}

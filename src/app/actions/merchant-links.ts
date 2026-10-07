"use server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { checkMerchantLink } from "@/lib/merchant-links";
const attempts = new Map<string, number>();
export async function checkGiftLinks(itemId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "unauthorized" };
  const gift = await prisma.wishlistItem.findFirst({
    where: {
      id: itemId,
      deletedAt: null,
      wishlist: { ownerId: session.user.id, archivedAt: null, deletedAt: null },
    },
    select: { url: true, alternativeUrls: true },
  });
  if (!gift) return { error: "forbidden" };
  const userId = session.user.id,
    now = Date.now();
  if ((attempts.get(userId) || 0) > now - 10000) return { error: "retryLater" };
  for (const [id, at] of attempts) if (at < now - 60000) attempts.delete(id);
  attempts.set(userId, now);
  const urls = [
    ...new Set(
      [gift.url, ...gift.alternativeUrls.split("\n")].filter(
        (v): v is string => !!v,
      ),
    ),
  ].slice(0, 6);
  const results = [];
  for (const url of urls)
    results.push({ url, status: await checkMerchantLink(url) });
  return { results };
}

import type { PrismaClient } from "@wishi/prisma-client";
export async function readGiftIdeas(db: PrismaClient, userId: string) {
  const items = await db.wishlistItem.findMany({
    where: {
      deletedAt: null,
      reservations: { none: {} },
      wishlist: {
        ownerId: { not: userId },
        archivedAt: null,
        deletedAt: null,
        visibility: { in: ["FAMILY", "PUBLIC"] },
        owner: {
          familyMembers: {
            some: { family: { members: { some: { userId } } } },
          },
        },
      },
    },
    take: 500,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      url: true,
      priceCents: true,
      currency: true,
      priority: true,
      image: true,
      size: true,
      color: true,
      model: true,
      isGroupGift: true,
      contributions: { select: { amountCents: true } },
      wishlist: {
        select: {
          id: true,
          name: true,
          recipient: { select: { name: true } },
          owner: { select: { name: true } },
          event: { select: { name: true, date: true } },
        },
      },
    },
  });
  return items
    .filter(
      (i) =>
        !i.isGroupGift ||
        !i.priceCents ||
        i.contributions.reduce((sum, c) => sum + c.amountCents, 0) <
          i.priceCents,
    )
    .map((item) => {
      const { contributions, ...gift } = item;
      void contributions;
      return { ...gift, isReserved: false, reservedByMe: false };
    });
}

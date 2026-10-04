import type { PrismaClient } from "@wishi/prisma-client";
import { createHash } from "node:crypto";
export const hashShareToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

export async function canReadWishlist(
  db: PrismaClient,
  wishlist: {
    ownerId: string;
    visibility: string;
    shareToken: string | null;
    archivedAt?: Date | null;
    deletedAt?: Date | null;
  },
  userId?: string,
  token?: string,
) {
  if (wishlist.deletedAt) return false;
  if (userId === wishlist.ownerId) return true;
  if (wishlist.archivedAt) return false;
  if (wishlist.visibility === "PUBLIC") return true;
  if (wishlist.visibility === "LINK")
    return Boolean(
      token && wishlist.shareToken && token === wishlist.shareToken,
    );
  if (wishlist.visibility !== "FAMILY" || !userId) return false;
  return Boolean(
    await db.family.findFirst({
      where: {
        AND: [
          { members: { some: { userId } } },
          { members: { some: { userId: wishlist.ownerId } } },
        ],
      },
      select: { id: true },
    }),
  );
}

export async function readWishlist(
  db: PrismaClient,
  id: string,
  userId?: string,
  token?: string,
) {
  const list = await db.wishlist.findUnique({ where: { id } });
  if (!list || !(await canReadWishlist(db, list, userId, token))) return null;
  const isOwner = list.ownerId === userId;
  const result = await db.wishlist.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      description: true,
      occasion: true,
      neededBy: true,
      preferences: true,
      ownerId: true,
      visibility: true,
      eventId: true,
      archivedAt: true,
      owner: { select: { name: true } },
      event: { select: { name: true } },
      items: {
        where: { deletedAt: null },
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
          ...(!isOwner
            ? {
                contributions: {
                  where:
                    list.visibility === "LINK"
                      ? {
                          accessTokenHash: list.shareToken
                            ? hashShareToken(list.shareToken)
                            : "invalid",
                        }
                      : {},
                  select: { userId: true, amountCents: true },
                },
              }
            : {}),
          ...(!isOwner ? { reservations: { select: { userId: true } } } : {}),
        },
      },
    },
  });
  if (!result) return null;
  return {
    ...result,
    isOwner,
    canEdit: isOwner && !list.archivedAt,
    items: result.items.map((item) => {
      // Never send reservation records or identities to the presentation layer.
      const { reservations, contributions, ...gift } = item;
      const contributedCents = !isOwner
        ? contributions?.reduce((sum, c) => sum + c.amountCents, 0) || 0
        : 0;
      return {
        ...gift,
        contributedCents,
        myContributionCents: !isOwner
          ? contributions?.find((c) => c.userId === userId)?.amountCents || 0
          : 0,
        isReserved:
          !isOwner &&
          (item.isGroupGift
            ? !!item.priceCents && contributedCents >= item.priceCents
            : Boolean(reservations?.length)),
        reservedByMe:
          !isOwner &&
          (item.isGroupGift
            ? Boolean(contributions?.some((c) => c.userId === userId))
            : Boolean(reservations?.some((r) => r.userId === userId))),
      };
    }),
  };
}

export async function reserveGift(
  db: PrismaClient,
  itemId: string,
  userId: string,
  token?: string,
) {
  const item = await db.wishlistItem.findUnique({
    where: { id: itemId },
    include: { wishlist: true },
  });
  if (
    !item ||
    item.isGroupGift ||
    item.deletedAt ||
    item.wishlist.archivedAt ||
    item.wishlist.deletedAt ||
    item.wishlist.ownerId === userId ||
    !(await canReadWishlist(db, item.wishlist, userId, token))
  )
    return { error: "forbidden" };
  try {
    // The unique itemId constraint is the final guard against concurrent reservations.
    await db.reservation.create({
      data: {
        itemId,
        userId,
        quantity: 1,
        accessTokenHash:
          item.wishlist.visibility === "LINK" && token
            ? hashShareToken(token)
            : null,
      },
    });
    return { success: true };
  } catch (error) {
    if (
      typeof error === "object" &&
      error &&
      "code" in error &&
      error.code === "P2002"
    )
      return { error: "alreadyReserved" };
    throw error;
  }
}

export async function readMyReservations(db: PrismaClient, userId: string) {
  const reservations = await db.reservation.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      item: {
        include: {
          wishlist: {
            include: {
              owner: { select: { name: true } },
              event: { select: { name: true } },
            },
          },
        },
      },
    },
  });
  return Promise.all(
    reservations.map(async ({ item, accessTokenHash }) => {
      const list = item.wishlist;
      const token =
        list.visibility === "LINK" &&
        list.shareToken &&
        accessTokenHash === hashShareToken(list.shareToken)
          ? list.shareToken
          : undefined;
      if (item.deletedAt || !(await canReadWishlist(db, list, userId, token)))
        return { itemId: item.id, gift: null };
      return {
        itemId: item.id,
        gift: {
          title: item.title,
          description: item.description,
          image: item.image,
          size: item.size,
          color: item.color,
          model: item.model,
          priceCents: item.priceCents,
          currency: item.currency,
          recipient: list.owner.name,
          event: list.event?.name,
          listName: list.name,
          href: token ? `/share/${token}` : `/dashboard/wishlists/${list.id}`,
          token,
        },
      };
    }),
  );
}

export async function cancelGift(
  db: PrismaClient,
  itemId: string,
  userId: string,
) {
  const result = await db.reservation.deleteMany({ where: { itemId, userId } });
  return result.count ? { success: true } : { error: "forbidden" };
}

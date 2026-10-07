import type { PrismaClient } from "@wishi/prisma-client";
import { canReadWishlist, hashShareToken } from "./wishlist-service";
export async function readReminders(
  db: PrismaClient,
  userId: string,
  now = new Date(),
) {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (kind: string) => parts.find((p) => p.type === kind)!.value;
  const today = new Date(
    `${part("year")}-${part("month")}-${part("day")}T00:00:00Z`,
  );
  const end = new Date(today);
  end.setUTCDate(end.getUTCDate() + 15);
  const [events, reservations, lists] = await Promise.all([
    db.event.findMany({
      where: {
        date: { gte: today, lt: end },
        family: { members: { some: { userId } } },
      },
      orderBy: { date: "asc" },
      take: 10,
      select: { id: true, name: true, date: true },
    }),
    db.reservation.findMany({
      where: {
        userId,
        item: {
          deletedAt: null,
          wishlist: {
            ownerId: { not: userId },
            archivedAt: null,
            deletedAt: null,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        item: {
          include: {
            wishlist: {
              include: {
                event: { select: { date: true } },
                recipient: { select: { name: true } },
                owner: { select: { name: true } },
              },
            },
          },
        },
      },
    }),
    db.wishlist.findMany({
      where: { ownerId: userId, archivedAt: null, deletedAt: null, OR: [{ items: { none: { deletedAt: null } } }, { neededBy: { gte: today.toISOString().slice(0, 10), lt: end.toISOString().slice(0, 10) } }] },
      take: 3, orderBy: { updatedAt: "desc" }, select: { id: true, name: true, neededBy: true, _count: { select: { items: { where: { deletedAt: null } } } } },
    }),
  ]);
  const gifts = [];
  for (const reservation of reservations) {
    const { item, accessTokenHash } = reservation,
      list = item.wishlist;
    const token =
      list.visibility === "LINK" &&
      list.shareToken &&
      accessTokenHash === hashShareToken(list.shareToken)
        ? list.shareToken
        : undefined;
    if (!(await canReadWishlist(db, list, userId, token))) continue;
    const due = list.neededBy
      ? new Date(list.neededBy + "T12:00:00Z")
      : list.event?.date || null;
    if (due && (due < today || due >= end)) continue;
    gifts.push({
      id: item.id,
      title: item.title,
      recipient: list.recipient?.name || list.owner.name || "—",
      due,
      href: token ? `/share/${token}` : `/dashboard/wishlists/${list.id}`,
    });
  }
  gifts.sort(
    (a, b) => (a.due?.getTime() || Infinity) - (b.due?.getTime() || Infinity),
  );
  return { events, gifts: gifts.slice(0, 12), lists };
}

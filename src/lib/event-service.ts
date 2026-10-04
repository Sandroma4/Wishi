import type { PrismaClient } from "@wishi/prisma-client";
export async function readEvent(db: PrismaClient, id: string, userId: string) {
  const event = await db.event.findFirst({
    where: { id, family: { members: { some: { userId } } } },
    select: {
      id: true,
      name: true,
      description: true,
      date: true,
      family: {
        select: {
          id: true,
          name: true,
          members: { where: { userId }, select: { role: true } },
        },
      },
    },
  });
  if (!event) return null;
  const wishlists = await db.wishlist.findMany({
    where: {
      eventId: id,
      archivedAt: null,
      deletedAt: null,
      OR: [
        { ownerId: userId },
        { visibility: "PUBLIC" },
        {
          visibility: "FAMILY",
          owner: {
            familyMembers: {
              some: { family: { members: { some: { userId } } } },
            },
          },
        },
      ],
    },
    select: {
      id: true,
      name: true,
      owner: { select: { name: true } },
      _count: { select: { items: { where: { deletedAt: null } } } },
    },
    orderBy: { createdAt: "desc" },
  });
  return {
    id: event.id,
    name: event.name,
    description: event.description,
    date: event.date,
    family: { id: event.family.id, name: event.family.name },
    canManage: event.family.members.some((member) => member.role === "ADMIN"),
    wishlists,
  };
}
export async function editEvent(
  db: PrismaClient,
  id: string,
  userId: string,
  data: { name: string; description: string; date: string },
) {
  const updated = await db.event.updateMany({
    where: { id, family: { members: { some: { userId, role: "ADMIN" } } } },
    data: { ...data, date: new Date(data.date + "T12:00:00Z") },
  });
  return updated.count ? { success: true } : { error: "forbidden" };
}
export async function removeEvent(
  db: PrismaClient,
  id: string,
  userId: string,
) {
  const deleted = await db.event.deleteMany({
    where: { id, family: { members: { some: { userId, role: "ADMIN" } } } },
  });
  return deleted.count ? { success: true } : { error: "forbidden" };
}

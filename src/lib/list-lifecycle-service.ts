import type { PrismaClient, Prisma } from "@wishi/prisma-client";
import { z } from "zod";
import { copyGiftPhoto, removeGiftPhoto } from "./gift-photos";

export async function changeListState(
  db: PrismaClient,
  id: string,
  ownerId: string,
  operation: "archive" | "trash" | "restore",
) {
  const result = await db.wishlist.updateMany({
    where: {
      id,
      ownerId,
      ...(operation === "restore"
        ? { OR: [{ archivedAt: { not: null } }, { deletedAt: { not: null } }] }
        : { deletedAt: null }),
    },
    data:
      operation === "restore"
        ? {
            archivedAt: null,
            deletedAt: null,
            visibility: "PRIVATE",
            shareToken: null,
          }
        : operation === "archive"
          ? { archivedAt: new Date(), shareToken: null }
          : { deletedAt: new Date(), shareToken: null },
  });
  return result.count ? { success: true } : { error: "forbidden" };
}

export async function duplicateList(
  db: PrismaClient,
  id: string,
  ownerId: string,
  name: string,
) {
  const parsed = z.string().trim().min(1).max(120).safeParse(name);
  if (!parsed.success) return { error: "invalidFields" };
  const source = await db.wishlist.findFirst({
    where: { id, ownerId, deletedAt: null },
    include: { items: { where: { deletedAt: null } } },
  });
  if (!source) return { error: "forbidden" };
  const photos: string[] = [];
  try {
    const items: Prisma.WishlistItemCreateWithoutWishlistInput[] = [];
    for (const item of source.items) {
      const image = await copyGiftPhoto(item.image);
      if (image) photos.push(image);
      items.push({
        title: item.title,
        description: item.description,
        url: item.url,
        priceCents: item.priceCents,
        currency: item.currency,
        priority: item.priority,
        size: item.size,
        color: item.color,
        model: item.model,
        image,
      });
    }
    const copy = await db.$transaction(async (tx) => {
      // Recheck ownership and lifecycle after copying photos; never copy reservations.
      if (
        !(await tx.wishlist.findFirst({
          where: { id, ownerId, deletedAt: null },
        }))
      )
        throw new Error("sourceUnavailable");
      return tx.wishlist.create({
        data: {
          name: parsed.data,
          description: source.description,
          ownerId,
          visibility: "PRIVATE",
          items: { create: items },
        },
      });
    });
    return { success: true, wishlistId: copy.id };
  } catch {
    await Promise.all(photos.map(removeGiftPhoto));
    return { error: "unexpected" };
  }
}

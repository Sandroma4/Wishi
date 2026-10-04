"use server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { fields, itemSchema } from "@/lib/validation";
import { refreshWishlists } from "@/lib/refresh";
import { reserveGift, cancelGift } from "@/lib/wishlist-service";
import { saveGiftPhoto, removeGiftPhoto } from "@/lib/gift-photos";
import {
  changeGiftState,
  readTrashedGifts,
} from "@/lib/gift-lifecycle-service";
async function upload(form: FormData) {
  const file = form.get("photo");
  return file instanceof File && file.size ? saveGiftPhoto(file) : null;
}
export async function createWishlistItem(form: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "unauthorized" };
  const parsed = itemSchema.safeParse(fields(form));
  const wishlistId = String(form.get("wishlistId") || "");
  if (!parsed.success) return { error: "invalidFields" };
  if (
    !(await prisma.wishlist.findFirst({
      where: {
        id: wishlistId,
        ownerId: session.user.id,
        archivedAt: null,
        deletedAt: null,
      },
    }))
  )
    return { error: "forbidden" };
  const { price, ...data } = parsed.data;
  let image: string | null = null;
  try {
    image = await upload(form);
  } catch {
    return { error: "invalidPhoto" };
  }
  try {
    await prisma.wishlistItem.create({
      data: { ...data, priceCents: price, wishlistId, image },
    });
  } catch (error) {
    await removeGiftPhoto(image);
    throw error;
  }
  refreshWishlists();
  return { success: true };
}
export async function updateWishlistItem(id: string, form: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "unauthorized" };
  const parsed = itemSchema.safeParse(fields(form));
  if (!parsed.success) return { error: "invalidFields" };
  const existing = await prisma.wishlistItem.findFirst({
    where: {
      id,
      deletedAt: null,
      wishlist: { ownerId: session.user.id, archivedAt: null, deletedAt: null },
    },
    select: { image: true },
  });
  if (!existing) return { error: "forbidden" };
  let image: string | null = null;
  try {
    image = await upload(form);
  } catch {
    return { error: "invalidPhoto" };
  }
  const nextImage =
    image || (form.get("removePhoto") === "on" ? null : existing.image);
  const { price, ...data } = parsed.data;
  let result;
  try {
    result = await prisma.wishlistItem.updateMany({
      where: {
        id,
        deletedAt: null,
        wishlist: {
          ownerId: session.user.id,
          archivedAt: null,
          deletedAt: null,
        },
      },
      data: { ...data, priceCents: price, image: nextImage },
    });
  } catch (error) {
    await removeGiftPhoto(image);
    throw error;
  }
  if (!result.count) {
    await removeGiftPhoto(image);
    return { error: "forbidden" };
  }
  if (nextImage !== existing.image) await removeGiftPhoto(existing.image);
  refreshWishlists();
  return { success: true };
}
export async function deleteWishlistItem(id: string) {
  return setGiftState(id, false);
}
export async function restoreWishlistItem(id: string) {
  return setGiftState(id, true);
}
async function setGiftState(id: string, restore: boolean) {
  const session = await auth();
  if (!session?.user?.id) return { error: "unauthorized" };
  const result = await changeGiftState(prisma, id, session.user.id, restore);
  refreshWishlists();
  return result;
}
export async function getTrashedGifts(wishlistId: string) {
  const session = await auth();
  return session?.user?.id
    ? readTrashedGifts(prisma, wishlistId, session.user.id)
    : [];
}
export async function reserveItem(id: string, token?: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "unauthorized" };
  const result = await reserveGift(prisma, id, session.user.id, token);
  refreshWishlists();
  return result;
}
export async function cancelReservation(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "unauthorized" };
  const result = await cancelGift(prisma, id, session.user.id);
  refreshWishlists();
  return result;
}

import { z } from "zod";
import type { PrismaClient } from "@wishi/prisma-client";
import { saveGiftPhoto, removeGiftPhoto } from "./gift-photos";
export const MAX_IMPORT_BYTES = 20 * 1024 * 1024;
const name = z.string().trim().min(1).max(120);
const optionalText = (max: number) =>
  z
    .string()
    .max(max)
    .nullable()
    .optional()
    .transform((v) => v || null);
const link = z
  .string()
  .max(2048)
  .refine((v) => {
    if (!v) return true;
    try {
      const u = new URL(v);
      return (
        ["http:", "https:"].includes(u.protocol) && !u.username && !u.password
      );
    } catch {
      return false;
    }
  });
const date = z.iso
  .datetime({ offset: true })
  .nullable()
  .optional()
  .transform((v) => (v ? new Date(v) : null));
const recipient = z.object({ name });
const schema = z
  .object({
    version: z.literal(1),
    account: z
      .object({ recipients: z.array(recipient).max(50).optional().default([]) })
      .optional(),
    lists: z
      .array(
        z.object({
          name,
          description: optionalText(2000),
          occasion: optionalText(120),
          preferences: optionalText(2000),
          neededBy: z.iso
            .date()
            .nullable()
            .optional()
            .transform((v) => v || null),
          archivedAt: date,
          deletedAt: date,
          recipient: recipient.nullable().optional(),
          gifts: z
            .array(
              z.object({
                title: name,
                description: optionalText(2000),
                url: link
                  .nullable()
                  .optional()
                  .transform((v) => v || null),
                alternativeUrls: z
                  .string()
                  .max(10240)
                  .optional()
                  .default("")
                  .refine((v) => {
                    const values = v.split(/\r?\n/).filter(Boolean);
                    return (
                      values.length <= 5 &&
                      values.every((s) => link.safeParse(s).success)
                    );
                  }),
                priceCents: z
                  .number()
                  .int()
                  .min(0)
                  .max(999999999)
                  .nullable()
                  .optional()
                  .transform((v) => v ?? null),
                currency: z
                  .string()
                  .regex(/^[A-Z]{3}$/)
                  .nullable()
                  .optional()
                  .transform((v) => v || "EUR"),
                priority: z
                  .enum(["LOW", "NORMAL", "HIGH", "ESSENTIAL"])
                  .optional()
                  .default("NORMAL"),
                size: optionalText(80),
                color: optionalText(80),
                model: optionalText(80),
                isGroupGift: z.boolean().optional().default(false),
                deletedAt: date,
                photo: z
                  .object({
                    mimeType: z.literal("image/webp"),
                    base64: z
                      .string()
                      .max(7 * 1024 * 1024)
                      .regex(
                        /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/,
                      )
                      .min(4),
                  })
                  .nullable()
                  .optional(),
              }),
            )
            .max(1000),
        }),
      )
      .max(100),
  })
  .refine((v) => v.lists.reduce((n, list) => n + list.gifts.length, 0) <= 2000);
export function parsePersonalExport(value: unknown) {
  return schema.parse(value);
}
export type PersonalExport = ReturnType<typeof parsePersonalExport>;
export async function importPersonalExport(
  db: PrismaClient,
  userId: string,
  document: PersonalExport,
) {
  const photos: string[] = [];
  const prepared: {
    list: PersonalExport["lists"][number];
    images: (string | null)[];
  }[] = [];
  try {
    for (const list of document.lists) {
      const images: (string | null)[] = [];
      for (const gift of list.gifts) {
        let image: string | null = null;
        if (gift.photo) {
          const bytes = Buffer.from(gift.photo.base64, "base64");
          image = await saveGiftPhoto(
            new File([bytes], "import.webp", { type: "image/webp" }),
          );
          photos.push(image);
        }
        images.push(image);
      }
      prepared.push({ list, images });
    }
    await db.$transaction(
      async (tx) => {
        const current = await tx.recipient.findMany({
          where: { ownerId: userId },
        });
        const recipients = new Map(
          current.map((r) => [r.name.trim().toLocaleLowerCase(), r.id]),
        );
        let recipientCount = current.length;
        const ensureRecipient = async (name: string) => {
          const key = name.trim().toLocaleLowerCase();
          if (recipients.has(key)) return recipients.get(key)!;
          if (recipientCount >= 50) throw new Error("recipientLimit");
          const r = await tx.recipient.create({
            data: { name, ownerId: userId },
          });
          recipientCount++;
          recipients.set(key, r.id);
          return r.id;
        };
        for (const r of document.account?.recipients || [])
          await ensureRecipient(r.name);
        for (const { list, images } of prepared) {
          const { gifts, recipient, ...data } = list;
          await tx.wishlist.create({
            data: {
              ...data,
              visibility: "PRIVATE",
              ownerId: userId,
              recipientId: recipient
                ? await ensureRecipient(recipient.name)
                : null,
              items: {
                create: gifts.map((gift, index) => {
                  const { photo, ...data } = gift;
                  void photo;
                  return {
                    ...data,
                    image: images[index],
                    isGroupGift:
                      data.isGroupGift &&
                      data.currency === "EUR" &&
                      !!data.priceCents,
                  };
                }),
              },
            },
          });
        }
      },
      { timeout: 60000 },
    );
  } catch (error) {
    await Promise.all(photos.map(removeGiftPhoto));
    throw error;
  }
  return {
    lists: document.lists.length,
    gifts: document.lists.reduce((n, l) => n + l.gifts.length, 0),
  };
}

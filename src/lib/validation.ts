import { z } from "zod";

const text = z.string().trim().min(1).max(120);
const description = z.string().trim().max(2000).default("");
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254)
  .pipe(z.email());
export const credentialsSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
});
export const passwordSchema = z
  .string()
  .min(12)
  .max(72)
  .refine((value) => new TextEncoder().encode(value).length <= 72);
export const registrationSchema = credentialsSchema.extend({
  name: text,
  password: passwordSchema,
});
export const wishlistSchema = z.object({
  occasion: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((v) => v || null),
  neededBy: z
    .union([z.literal(""), z.iso.date()])
    .optional()
    .transform((v) => v || null),
  preferences: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .transform((v) => v || null),
  name: text,
  description,
  visibility: z.enum(["PRIVATE", "FAMILY", "LINK", "PUBLIC"]),
  eventId: z
    .string()
    .max(100)
    .optional()
    .transform((value) => value || null),
});
export const itemSchema = z.object({
  isGroupGift: z
    .enum(["on", "off"])
    .optional()
    .transform((v) => v === "on"),
  size: z
    .string()
    .trim()
    .max(80)
    .optional()
    .transform((v) => v || null),
  color: z
    .string()
    .trim()
    .max(80)
    .optional()
    .transform((v) => v || null),
  model: z
    .string()
    .trim()
    .max(80)
    .optional()
    .transform((v) => v || null),
  title: text,
  description,
  url: z
    .union([
      z.literal(""),
      z
        .url()
        .refine((value) =>
          ["https:", "http:"].includes(new URL(value).protocol),
        ),
    ])
    .default(""),
  price: z
    .string()
    .trim()
    .refine((value) => value === "" || /^\d{1,7}(\.\d{1,2})?$/.test(value))
    .transform((value) =>
      value === "" ? null : Math.round(Number(value) * 100),
    ),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "ESSENTIAL"]),
});
export const familySchema = z.object({ name: text, description });
export const eventSchema = familySchema.extend({
  date: z.iso.date(),
  familyId: z.string().min(1).max(100),
});
export const eventDetailsSchema = familySchema.extend({ date: z.iso.date() });
export function fields(form: FormData) {
  return Object.fromEntries(form.entries());
}

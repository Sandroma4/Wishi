"use server";
import { prisma } from "@/lib/prisma";
import { emailSchema, passwordSchema } from "@/lib/validation";
import { requestReset, resetPassword } from "@/lib/password-reset-service";
import { mailConfiguration, sendResetMail } from "@/lib/reset-mail";
export async function requestPasswordReset(form: FormData, locale: string) {
  const email = emailSchema.safeParse(form.get("email"));
  if (!email.success) return { error: "invalidFields" };
  try {
    mailConfiguration();
  } catch {
    return { error: "emailUnavailable" };
  }
  if (!process.env.AUTH_SECRET) return { error: "emailUnavailable" };
  await requestReset(
    prisma,
    email.data,
    (token) => sendResetMail(email.data, token, locale),
    process.env.AUTH_SECRET,
  );
  return { success: true };
}
export async function completePasswordReset(token: string, form: FormData) {
  const password = passwordSchema.safeParse(form.get("password"));
  if (!password.success) return { error: "invalidFields" };
  if (password.data !== form.get("confirmation"))
    return { error: "passwordMismatch" };
  return resetPassword(prisma, token, password.data);
}

"use server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { submitFeedback } from "@/lib/feedback-service";
import { revalidatePath } from "next/cache";
export async function sendFeedback(form: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "unauthorized" };
  const result = await submitFeedback(
    prisma,
    session.user.id,
    String(form.get("category") || ""),
    String(form.get("message") || ""),
    process.env.AUTH_SECRET || "local-feedback",
  );
  revalidatePath("/[locale]/dashboard/feedback", "page");
  return result;
}

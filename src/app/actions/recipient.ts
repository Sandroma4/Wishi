"use server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { refreshWishlists } from "@/lib/refresh";
import { manageRecipient } from "@/lib/recipient-service";
export async function updateRecipient(id: string, form: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "unauthorized" };
  const operation = form.get("operation");
  const change =
    operation === "rename"
      ? ({ operation, name: String(form.get("name") || "") } as const)
      : operation === "merge"
        ? ({ operation, targetId: String(form.get("targetId") || "") } as const)
        : operation === "delete"
          ? ({ operation } as const)
          : null;
  if (!change) return { error: "invalidFields" };
  const result = await manageRecipient(prisma, session.user.id, id, change);
  if ("success" in result && result.success) refreshWishlists();
  return result;
}
export async function createRecipient(form: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "unauthorized" };
  const name = String(form.get("name") || "").trim();
  if (!name || name.length > 120) return { error: "invalidFields" };
  if (
    (await prisma.recipient.count({ where: { ownerId: session.user.id } })) >=
    50
  )
    return { error: "invalidFields" };
  await prisma.recipient.create({ data: { name, ownerId: session.user.id } });
  refreshWishlists();
  return { success: true };
}

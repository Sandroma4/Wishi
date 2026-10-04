"use server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { fields, eventSchema, eventDetailsSchema } from "@/lib/validation";
import { readEvent, editEvent, removeEvent } from "@/lib/event-service";
import { refreshWishlists } from "@/lib/refresh";
export async function getEvents(includePast = false) {
  const session = await auth();
  if (!session?.user?.id) return [];
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  return prisma.event.findMany({
    where: {
      family: { members: { some: { userId: session.user.id } } },
      date: includePast ? { lt: today } : { gte: today },
    },
    include: { family: true },
    orderBy: { date: includePast ? "desc" : "asc" },
  });
}
export async function getEventFamilies() {
  const session = await auth();
  if (!session?.user?.id) return [];
  return prisma.family.findMany({
    where: { members: { some: { userId: session.user.id } } },
    select: { id: true, name: true },
  });
}
export async function getEvent(id: string) {
  const session = await auth();
  return session?.user?.id ? readEvent(prisma, id, session.user.id) : null;
}
export async function updateEvent(id: string, form: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "unauthorized" };
  const parsed = eventDetailsSchema.safeParse(fields(form));
  if (!parsed.success) return { error: "invalidFields" };
  const result = await editEvent(prisma, id, session.user.id, parsed.data);
  refreshWishlists();
  return result;
}
export async function deleteEvent(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "unauthorized" };
  const result = await removeEvent(prisma, id, session.user.id);
  refreshWishlists();
  return result;
}
export async function createEvent(form: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "unauthorized" };
  const parsed = eventSchema.safeParse(fields(form));
  if (!parsed.success) return { error: "invalidFields" };
  const { familyId, date, ...data } = parsed.data;
  if (
    !(await prisma.familyMember.findUnique({
      where: { userId_familyId: { userId: session.user.id, familyId } },
    }))
  )
    return { error: "forbidden" };
  await prisma.event.create({
    data: { ...data, familyId, date: new Date(date + "T12:00:00Z") },
  });
  refreshWishlists();
  return { success: true };
}

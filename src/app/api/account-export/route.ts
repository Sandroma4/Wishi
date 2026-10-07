import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { readGiftPhoto } from "@/lib/gift-photos";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });
  const userId = session.user.id;
  const account = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      email: true,
      locale: true,
      recipients: { select: { name: true } },
    },
  });
  async function* chunks() {
    yield `{"version":1,"exportedAt":${JSON.stringify(new Date().toISOString())},"account":${JSON.stringify(account)},"lists":[`;
    let listCursor: string | undefined,
      firstList = true;
    while (!request.signal.aborted) {
      const lists = await prisma.wishlist.findMany({
        where: { ownerId: userId },
        orderBy: { id: "asc" },
        take: 50,
        ...(listCursor ? { cursor: { id: listCursor }, skip: 1 } : {}),
        select: {
          id: true,
          name: true,
          description: true,
          occasion: true,
          neededBy: true,
          preferences: true,
          visibility: true,
          archivedAt: true,
          deletedAt: true,
          recipient: { select: { name: true } },
        },
      });
      if (!lists.length) break;
      for (const list of lists) {
        yield `${firstList ? "" : ","}${JSON.stringify(list).slice(0, -1)},"gifts":[`;
        firstList = false;
        let itemCursor: string | undefined,
          firstItem = true;
        while (!request.signal.aborted) {
          const items = await prisma.wishlistItem.findMany({
            where: { wishlistId: list.id, wishlist: { ownerId: userId } },
            orderBy: { id: "asc" },
            take: 50,
            ...(itemCursor ? { cursor: { id: itemCursor }, skip: 1 } : {}),
            select: {
              id: true,
              title: true,
              description: true,
              url: true,
              alternativeUrls: true,
              priceCents: true,
              currency: true,
              image: true,
              priority: true,
              size: true,
              color: true,
              model: true,
              isGroupGift: true,
              deletedAt: true,
            },
          });
          if (!items.length) break;
          for (const item of items) {
            const bytes = item.image ? await readGiftPhoto(item.image) : null;
            yield `${firstItem ? "" : ","}${JSON.stringify({ ...item, photo: bytes ? { mimeType: "image/webp", base64: bytes.toString("base64") } : null })}`;
            firstItem = false;
          }
          itemCursor = items.at(-1)!.id;
        }
        yield "]}";
      }
      listCursor = lists.at(-1)!.id;
    }
    yield "]}";
  }
  const iterator = chunks(),
    encoder = new TextEncoder();
  return new Response(
    new ReadableStream({
      async pull(controller) {
        try {
          const next = await iterator.next();
          if (next.done) controller.close();
          else controller.enqueue(encoder.encode(next.value));
        } catch (error) {
          controller.error(error);
        }
      },
      async cancel() {
        await iterator.return(undefined);
      },
    }),
    {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": 'attachment; filename="cadeoly-export.json"',
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    },
  );
}

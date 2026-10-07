import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  importPersonalExport,
  parsePersonalExport,
  MAX_IMPORT_BYTES,
} from "@/lib/personal-import";
import { refreshWishlists } from "@/lib/refresh";
const attempts = new Map<string, number>();
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id)
    return Response.json({ error: "unauthorized" }, { status: 401 });
  const origin = request.headers.get("origin");
  let sameOrigin = !origin;
  if (origin) {
    try {
      sameOrigin =
        new URL(origin).host ===
        (request.headers.get("host") || new URL(request.url).host);
    } catch {}
  }
  if (
    !request.headers.get("content-type")?.startsWith("application/json") ||
    !sameOrigin
  )
    return Response.json({ error: "forbidden" }, { status: 403 });
  const userId = session.user.id;
  try {
    if (Number(request.headers.get("content-length")) > MAX_IMPORT_BYTES)
      throw new Error("tooLarge");
    const reader = request.body?.getReader();
    if (!reader) throw new Error("empty");
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > MAX_IMPORT_BYTES) {
        await reader.cancel();
        throw new Error("tooLarge");
      }
      chunks.push(chunk.value);
    }
    const input = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    const document = parsePersonalExport(input.document);
    const summary = {
      lists: document.lists.map((l) => ({
        name: l.name,
        gifts: l.gifts.length,
        photos: l.gifts.filter((g) => g.photo).length,
      })),
      gifts: document.lists.reduce((n, l) => n + l.gifts.length, 0),
    };
    if (input.confirm !== true)
      return Response.json(summary, {
        headers: { "Cache-Control": "private, no-store" },
      });
    if ((attempts.get(userId) || 0) > Date.now() - 30000)
      return Response.json({ error: "retryLater" }, { status: 429 });
    for (const [id, at] of attempts)
      if (at < Date.now() - 60000) attempts.delete(id);
    attempts.set(userId, Date.now());
    const result = await importPersonalExport(prisma, userId, document);
    refreshWishlists();
    return Response.json(result, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    return Response.json({ error: "invalidImport" }, { status: 400 });
  }
}

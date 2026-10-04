import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { photoName, readGiftPhoto } from "@/lib/gift-photos";
import { canReadWishlist } from "@/lib/wishlist-service";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ filename: string }> },
) {
  const { filename } = await params;
  if (!photoName.test(filename)) return new Response(null, { status: 404 });
  const item = await prisma.wishlistItem.findFirst({
    where: { image: filename },
    include: { wishlist: true },
  });
  const session = await auth();
  if (
    !item ||
    item.deletedAt ||
    !(await canReadWishlist(
      prisma,
      item.wishlist,
      session?.user?.id,
      new URL(request.url).searchParams.get("token") || undefined,
    ))
  )
    return new Response(null, { status: 404 });
  const bytes = await readGiftPhoto(filename);
  return bytes
    ? new Response(new Uint8Array(bytes), {
        headers: {
          "Content-Type": "image/webp",
          "Cache-Control": "private, no-store",
          "X-Content-Type-Options": "nosniff",
        },
      })
    : new Response(null, { status: 404 });
}

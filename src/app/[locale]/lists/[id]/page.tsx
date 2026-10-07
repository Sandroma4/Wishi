import { notFound } from "next/navigation";
import { getPublicWishlist } from "@/app/actions/wishlist";
import { auth } from "@/auth";
import { WishlistView } from "@/components/wishlist/WishlistView";
import { PublicListHeader } from "@/components/wishlist/PublicListHeader";
export default async function PublicListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const list = await getPublicWishlist(id);
  if (!list) notFound();
  const session = await auth();
  return (
    <main className="public-container">
      <PublicListHeader />
      <WishlistView wishlist={list} loggedIn={Boolean(session?.user?.id)} />
    </main>
  );
}

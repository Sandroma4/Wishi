import { notFound } from "next/navigation";
import { getSharedWishlist } from "@/app/actions/wishlist";
import { auth } from "@/auth";
import { WishlistView } from "@/components/wishlist/WishlistView";
export const metadata = { robots: { index: false, follow: false } };
export default async function SharedPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const wishlist = await getSharedWishlist(token);
  if (!wishlist) notFound();
  const session = await auth();
  return (
    <main className="public-container">
      <WishlistView
        wishlist={wishlist}
        loggedIn={Boolean(session?.user?.id)}
        token={token}
      />
    </main>
  );
}

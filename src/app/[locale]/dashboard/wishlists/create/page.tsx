import { getEvents } from "@/app/actions/event";
import { WishlistForm } from "@/components/wishlist/WishlistForm";
export default async function CreateWishlistPage() {
  return <WishlistForm events={await getEvents()} />;
}

import { getEvents, getEvent } from "@/app/actions/event";
import { WishlistForm } from "@/components/wishlist/WishlistForm";
import { WishlistHelp } from "@/components/wishlist/WishlistHelp";
export default async function CreateWishlistPage({
  searchParams,
}: {
  searchParams: Promise<{ eventId?: string }>;
}) {
  const events = (await getEvents()).map(({ id, name }) => ({ id, name }));
  const requested = (await searchParams).eventId;
  if (requested && !events.some((event) => event.id === requested)) {
    const event = await getEvent(requested);
    if (event) events.push({ id: event.id, name: event.name });
  }
  const defaultEventId = events.some((event) => event.id === requested)
    ? requested
    : undefined;
  return (
    <div className="stack focused-page">
      <WishlistHelp />
      <WishlistForm events={events} defaultEventId={defaultEventId} />
    </div>
  );
}

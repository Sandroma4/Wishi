import { ListSectionNavigation } from "@/components/wishlist/ListSectionNavigation";
import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { getWishlistById } from "@/app/actions/wishlist";
import { getEvents } from "@/app/actions/event";
import { prisma } from "@/lib/prisma";
import { WishlistView } from "@/components/wishlist/WishlistView";
import { WishlistForm } from "@/components/wishlist/WishlistForm";
import { WishlistManager } from "@/components/wishlist/WishlistManager";
import { ListLifecycle } from "@/components/wishlist/ListLifecycle";
import { getTrashedGifts } from "@/app/actions/item";
import { GiftTrash } from "@/components/wishlist/GiftTrash";
export default async function WishlistDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { id } = await params;
  const wishlist = await getWishlistById(id);
  if (!wishlist) notFound();
  const nav = await getTranslations("listNavigation");
  const from = (await searchParams).from;
  const back = wishlist.isOwner
    ? "/dashboard/wishlists" + (from === "archived" ? "?view=archived" : "")
    : "/dashboard/family";
  const events = wishlist.isOwner ? await getEvents() : [];
  if (
    wishlist.isOwner &&
    wishlist.eventId &&
    !events.some((event) => event.id === wishlist.eventId)
  ) {
    const event = await prisma.event.findFirst({
      where: {
        id: wishlist.eventId,
        family: { members: { some: { userId: wishlist.ownerId } } },
      },
      include: { family: true, _count: { select: { wishlists: true } } },
    });
    if (event) events.push(event);
  }
  const token = wishlist.isOwner
    ? (
        await prisma.wishlist.findUnique({
          where: { id },
          select: { shareToken: true },
        })
      )?.shareToken || null
    : null;
  return (
    <div className="stack">
      <Link className="list-back" href={back}>
        ← {nav(wishlist.isOwner ? "back" : "backFamily")}
      </Link>
      <ListSectionNavigation
        editable={wishlist.canEdit}
        owner={wishlist.isOwner}
      />
      <WishlistView wishlist={wishlist} loggedIn />

      {wishlist.isOwner && (
        <details id="list-manage" className="form-options">
          <summary>{nav("manage")}</summary>
          <ListLifecycle
            id={id}
            name={wishlist.name}
            state={wishlist.archivedAt ? "archived" : "active"}
          />
        </details>
      )}
      {wishlist.archivedAt && (
        <p>{(await getTranslations("listLifecycle"))("archiveHelp")}</p>
      )}
      {wishlist.canEdit && (
        <section id="list-share">
          <WishlistManager
            id={id}
            visibility={wishlist.visibility}
            token={token}
          />
        </section>
      )}
      {wishlist.canEdit && (
        <details id="list-settings" className="form-options">
          <summary>{nav("settings")}</summary>
          <div className="stack">
            <WishlistForm
              key={JSON.stringify([
                wishlist.name,
                wishlist.description,
                wishlist.occasion,
                wishlist.neededBy,
                wishlist.preferences,
                wishlist.visibility,
                wishlist.eventId,
              ])}
              events={events}
              initial={wishlist}
            />
          </div>
        </details>
      )}
      {wishlist.canEdit && <GiftTrash gifts={await getTrashedGifts(id)} />}
    </div>
  );
}

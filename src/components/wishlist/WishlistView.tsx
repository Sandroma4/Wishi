import { OccasionIcon } from "@/components/ui/OccasionIcon";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { MerchantLinks } from "./MerchantLinks";
import { readWishlist } from "@/lib/wishlist-service";
import { AddItemForm } from "./AddItemForm";
import { ReserveButton } from "./ReserveButton";
import { GiftDetails, GiftImage } from "./GiftDetails";
import { GiftBrowser } from "./GiftBrowser";
import { ContributionForm } from "./ContributionForm";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/Card";
export async function WishlistView({
  wishlist,
  loggedIn,
  token,
  previewOnly = false,
}: {
  wishlist: NonNullable<Awaited<ReturnType<typeof readWishlist>>>;
  loggedIn: boolean;
  token?: string;
  previewOnly?: boolean;
}) {
  const t = await getTranslations("wishlist");
  const c = await getTranslations("common");
  const flow = await getTranslations("dailyFlow");
  const locale = await getLocale();
  return (
    <div className="stack" id="list-gifts">
      <header>
        <h1>{wishlist.name}</h1>
        <div className="wishlist-header-meta">
          <p>{t("byOwner", { name: wishlist.owner.name || c("unknown") })}</p>
          {wishlist.recipient && (
            <p>{t("forRecipient", { name: wishlist.recipient.name })}</p>
          )}
          {wishlist.event && (
            <p>
              {t("event")}: {wishlist.event.name}
            </p>
          )}
          {wishlist.occasion && (
            <p>
              {t("occasion")}: {wishlist.occasion}
            </p>
          )}
          {wishlist.neededBy && (
            <p>
              {t("neededBy")}:{" "}
              {new Intl.DateTimeFormat(locale, {
                dateStyle: "long",
                timeZone: "UTC",
              }).format(new Date(wishlist.neededBy + "T00:00:00Z"))}
            </p>
          )}
        </div>
      </header>
      {wishlist.description && <p>{wishlist.description}</p>}
      {wishlist.preferences && (
        <p style={{ whiteSpace: "pre-wrap" }}>{wishlist.preferences}</p>
      )}
      {wishlist.isOwner && (
        <>
          <p className="wishlist-privacy-note">
            <svg
              aria-hidden="true"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <rect x="5" y="10" width="14" height="11" rx="2" />
              <path d="M8 10V6a4 4 0 0 1 8 0v4" />
            </svg>{" "}
            {t("surprise")}
          </p>
          {wishlist.canEdit && wishlist.items.length > 0 && (
            <AddItemForm wishlistId={wishlist.id} />
          )}
        </>
      )}
      {!wishlist.items.length && (
        <div className="empty-state wishlist-empty">
          <div className="wishlist-empty-intro">
            <div className="empty-art">
              <OccasionIcon />
            </div>
            <p>{wishlist.canEdit ? flow("firstWish") : t("noItems")}</p>
            <p>
              {flow(wishlist.canEdit ? "emptyGiftsOwner" : "emptyGiftsVisitor")}
            </p>
          </div>
          {wishlist.canEdit && <AddItemForm wishlistId={wishlist.id} />}
        </div>
      )}
      {wishlist.items.length > 0 && (
        <GiftBrowser
          owner={wishlist.isOwner}
          gifts={wishlist.items.map((item) => ({
            ...item,
            card: (
              <Card key={item.id} className="gift-card">
                <GiftImage gift={item} token={token} />
                <CardHeader>
                  <CardTitle>{item.title}</CardTitle>
                  {item.isGroupGift && (
                    <p className="visual-badge">{t("groupGift")}</p>
                  )}
                  <p className="gift-price">
                    {item.priceCents !== null
                      ? new Intl.NumberFormat(locale, {
                          style: "currency",
                          currency: item.currency || "EUR",
                        }).format(item.priceCents / 100)
                      : ""}{" "}
                    <span className="visual-badge">
                      {t(
                        "priority" +
                          item.priority[0] +
                          item.priority.slice(1).toLowerCase(),
                      )}
                    </span>
                  </p>
                </CardHeader>
                <CardContent>
                  <GiftDetails gift={item} token={token} showImage={false} />
                  {item.description && <p>{item.description}</p>}
                  {item.url &&
                    (item.url.startsWith("https://") ||
                      item.url.startsWith("http://")) && (
                      <a
                        className="product-link"
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {t("viewProduct")} <span aria-hidden="true">↗</span>
                      </a>
                    )}
                  {(item.alternativeUrls || "")
                    .split("\n")
                    .filter((url) => /^https?:\/\//.test(url))
                    .map((url, index) => (
                      <a
                        key={url}
                        className="product-link"
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {t("alternativeLink", { number: index + 1 })} ↗
                      </a>
                    ))}
                </CardContent>
                <CardFooter>
                  {previewOnly ? (
                    <p>{t("previewOnly")}</p>
                  ) : wishlist.isOwner ? (
                    wishlist.canEdit && (
                        <div className="stack"><AddItemForm wishlistId={wishlist.id} item={item} />{(item.url || item.alternativeUrls) && <MerchantLinks itemId={item.id} />}</div>
                    )
                  ) : loggedIn && item.isGroupGift ? (
                    <ContributionForm
                      key={item.myContributionCents}
                      itemId={item.id}
                      mine={item.myContributionCents}
                      total={item.contributedCents}
                      target={item.priceCents || 0}
                      token={token}
                    />
                  ) : loggedIn ? (
                    <ReserveButton
                      itemId={item.id}
                      isReserved={item.isReserved}
                      reservedByMe={item.reservedByMe}
                      token={token}
                    />
                  ) : (
                    <Link
                      href={{
                        pathname: "/login",
                        query: token
                          ? { next: "/" + locale + "/share/" + token }
                          : { next: "/" + locale + "/lists/" + wishlist.id },
                      }}
                    >
                      {t("signInToReserve")}
                    </Link>
                  )}
                </CardFooter>
              </Card>
            ),
          }))}
        />
      )}
    </div>
  );
}

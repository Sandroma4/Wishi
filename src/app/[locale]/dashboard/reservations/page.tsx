import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { readMyReservations } from "@/lib/wishlist-service";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { ReserveButton } from "@/components/wishlist/ReserveButton";
import { GiftDetails } from "@/components/wishlist/GiftDetails";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { readMyContributions } from "@/lib/contribution-service";
import { ContributionForm } from "@/components/wishlist/ContributionForm";
export default async function ReservationsPage() {
  const session = await auth();
  const locale = await getLocale();
  if (!session?.user?.id) redirect("/" + locale + "/login");
  const reservations = await readMyReservations(prisma, session.user.id);
  const contributions = await readMyContributions(prisma, session.user.id);
  const group = await getTranslations("contributions");
  const t = await getTranslations("reservations");
  return (
    <div className="stack">
      <h1>{t("title")}</h1>
      <p>{t("intro")}</p>
      {!!contributions.length && (
        <section className="stack">
          <h2>{group("title")}</h2>
          {contributions.map((row) => (
            <Card key={row.itemId}>
              <CardContent>
                <h3>{row.title || t("unavailable")}</h3>
                {row.href && <Link href={row.href}>{group("open")}</Link>}
                <ContributionForm
                  itemId={row.itemId}
                  mine={row.amountCents}
                  cancelOnly
                />
              </CardContent>
            </Card>
          ))}
        </section>
      )}
      {!reservations.length && <p>{t("empty")}</p>}
      <div className="gift-grid">
        {reservations.map(({ itemId, gift }) => (
          <Card key={itemId}>
            <CardContent>
              <div className="stack">
                {gift ? (
                  <>
                    <h2>{gift.title}</h2>
                    <p>{t("for", { name: gift.recipient || t("unknown") })}</p>
                    {gift.event && <p>{gift.event}</p>}
                    <GiftDetails gift={gift} token={gift.token} />
                    {gift.priceCents !== null && (
                      <p>
                        {new Intl.NumberFormat(locale, {
                          style: "currency",
                          currency: gift.currency || "EUR",
                        }).format(gift.priceCents / 100)}
                      </p>
                    )}
                    <Link href={gift.href}>{gift.listName}</Link>
                  </>
                ) : (
                  <>
                    <h2>{t("unavailable")}</h2>
                    <p>{t("accessChanged")}</p>
                  </>
                )}
                <ReserveButton itemId={itemId} isReserved reservedByMe />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

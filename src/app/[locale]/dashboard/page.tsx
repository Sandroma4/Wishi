import styles from "./page.module.css";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { getTranslations, getLocale } from "next-intl/server";
import { getEvents } from "@/app/actions/event";
import { getMyWishlists, getFamilyWishlists } from "@/app/actions/wishlist";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/routing";
export default async function DashboardPage() {
  const [t, w, c, locale, events, lists, familyLists, session] =
    await Promise.all([
      getTranslations("dashboard"),
      getTranslations("wishlist"),
      getTranslations("common"),
      getLocale(),
      getEvents(),
      getMyWishlists(),
      getFamilyWishlists(undefined, 5),
      auth(),
    ]);
  const user = session?.user?.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { name: true },
      })
    : null;
  return (
    <div className="stack">
      <header>
        <h1>{t("hello", { name: user?.name || c("unknown") })}</h1>
        <p>{t("intro")}</p>
      </header>
      <div className={styles.grid}>
        <Card>
          <CardHeader>
            <CardTitle>{t("upcomingEvents")}</CardTitle>
          </CardHeader>
          <CardContent>
            {!events.length && <p>{t("noEvents")}</p>}
            <ul className="stack">
              {events.slice(0, 3).map((event) => (
                <li key={event.id}>
                  <Link href={`/dashboard/events/${event.id}`}>
                    {event.name}
                  </Link>
                  <p>
                    {new Intl.DateTimeFormat(locale, {
                      dateStyle: "long",
                      timeZone: "UTC",
                    }).format(event.date)}{" "}
                    · {event.family.name}
                  </p>
                </li>
              ))}
            </ul>
            <Link href="/dashboard/events">{t("createEvent")}</Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("myWishlists")}</CardTitle>
          </CardHeader>
          <CardContent>
            {!lists.length && <p>{w("empty")}</p>}
            <ul className="stack">
              {lists.slice(0, 3).map((list) => (
                <li key={list.id}>
                  <Link href={"/dashboard/wishlists/" + list.id}>
                    {list.name}
                  </Link>
                  <p>{w("itemsCount", { count: list._count.items })}</p>
                </li>
              ))}
            </ul>
            <Link href="/dashboard/wishlists/create">{t("newWishlist")}</Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("familyActivity")}</CardTitle>
          </CardHeader>
          <CardContent>
            {!familyLists.length && <p>{t("noActivity")}</p>}
            <ul className="stack">
              {familyLists.map((list) => (
                <li key={list.id}>
                  <Link href={"/dashboard/wishlists/" + list.id}>
                    {list.name}
                  </Link>
                  <p>
                    {w("byOwner", { name: list.owner.name || c("unknown") })} ·{" "}
                    {w("itemsCount", { count: list._count.items })}
                  </p>
                </li>
              ))}
            </ul>
            <Link href="/dashboard/family">{t("invite")}</Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

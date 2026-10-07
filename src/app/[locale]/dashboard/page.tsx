import styles from "./page.module.css";
import { OccasionIcon } from "@/components/ui/OccasionIcon";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { getTranslations, getLocale } from "next-intl/server";
import { getEvents } from "@/app/actions/event";
import { getMyWishlists, getFamilyWishlists } from "@/app/actions/wishlist";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/routing";
import { Reminders } from "@/components/dashboard/Reminders";
import { readReminders } from "@/lib/reminders";
export default async function DashboardPage() {
  const [t, w, c, locale, events, lists, familyLists, session] =
    await Promise.all([
      getTranslations("dashboard"),
      getTranslations("wishlist"),
      getTranslations("common"),
      getLocale(),
      getEvents(false, 3),
      getMyWishlists("active", 3),
      getFamilyWishlists(undefined, 5),
      auth(),
    ]);
  const [guide, user, familyCount] = await Promise.all([
    getTranslations("onboarding"),
    session?.user?.id
      ? prisma.user.findUnique({
          where: { id: session.user.id },
          select: { name: true },
        })
      : null,
    session?.user?.id
      ? prisma.familyMember.count({ where: { userId: session.user.id } })
      : 0,
  ]);
  const audit = await getTranslations("auditUI");
  return (
    <div className="stack">
      <header className={styles.greeting}>
        <h1>
          {t("hello", {
            name: user?.name?.trim().split(/\s+/)[0] || c("unknown"),
          })}
        </h1>
        <p>{t("intro")}</p>
      </header>
      <div className="button-row dashboard-actions">
        <Link className="primary-link" href="/quick-add">
          {(await getTranslations("convenience"))("quickAdd")}
        </Link>
        <Link className="secondary-link" href="/dashboard/gift-ideas">
          {(await getTranslations("convenience"))("ideas")}
        </Link>
      </div>
      <div className={styles.overview}>
        {session?.user?.id && (
          <Reminders reminders={await readReminders(prisma, session.user.id)} />
        )}
        {(!familyCount || !lists.length) && (
          <details className="onboarding-panel">
            <summary>
              <strong>{guide("title")}</strong>
              <span>
                {audit("progress", {
                  count: Number(!!familyCount) + Number(!!lists.length),
                  total: 2,
                })}
              </span>
            </summary>
            <div className="stack">
              <p>{guide("intro")}</p>
              <ol className="onboarding-steps">
                <li>
                  <strong>{guide("family")}</strong>
                  <p>
                    {familyCount ? guide("familyDone") : guide("familyHelp")}
                  </p>
                  <Link className="secondary-link" href="/dashboard/family">
                    {familyCount ? audit("seeFamily") : audit("startFamily")}
                  </Link>
                </li>
                <li>
                  <strong>{guide("list")}</strong>
                  <p>{lists.length ? guide("listDone") : guide("listHelp")}</p>
                  <Link
                    className="secondary-link"
                    href={
                      lists.length
                        ? "/dashboard/wishlists"
                        : "/dashboard/wishlists/create"
                    }
                  >
                    {lists.length ? audit("seeLists") : t("newWishlist")}
                  </Link>
                </li>
              </ol>
              <div>
                <strong>{guide("share")}</strong>
                <p>{guide("shareHelp")}</p>
                <Link
                  className="secondary-link"
                  href={
                    lists.length
                      ? `/dashboard/wishlists/${lists[0].id}`
                      : "/dashboard/wishlists/create"
                  }
                >
                  {lists.length ? guide("share") : t("newWishlist")}
                </Link>
              </div>
            </div>
          </details>
        )}
      </div>
      <div className={styles.grid}>
        <Card className={`${styles.summaryCard} ${styles.listsCard}`}>
          <CardHeader>
            <CardTitle>{t("myWishlists")}</CardTitle>
          </CardHeader>
          <CardContent className={styles.cardBody}>
            {!lists.length ? (
              <div className={styles.emptyContent}>
                <span className={styles.emptyIcon}>
                  <OccasionIcon kind="gift" />
                </span>
                <p>{w("empty")}</p>
              </div>
            ) : (
              <ul className={styles.entries}>
                {lists.map((list) => (
                  <li key={list.id}>
                    <Link href={"/dashboard/wishlists/" + list.id}>
                      {list.name}
                    </Link>
                    <p>{w("itemsCount", { count: list._count.items })}</p>
                  </li>
                ))}
              </ul>
            )}
            <Link
              className={`primary-link ${styles.cardAction}`}
              href="/dashboard/wishlists/create"
            >
              <span aria-hidden="true">+</span>
              {t("newWishlist")}
            </Link>
          </CardContent>
        </Card>
        <Card className={styles.summaryCard}>
          <CardHeader>
            <CardTitle>{t("upcomingEvents")}</CardTitle>
          </CardHeader>
          <CardContent className={styles.cardBody}>
            {!events.length ? (
              <div className={styles.emptyContent}>
                <span className={styles.emptyIcon}>
                  <OccasionIcon kind="calendar" />
                </span>
                <p>{t("noEvents")}</p>
              </div>
            ) : (
              <ul className={styles.entries}>
                {events.map((event) => (
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
            )}
            <Link
              className={`primary-link ${styles.cardAction}`}
              href="/dashboard/events"
            >
              <span aria-hidden="true">+</span>
              {t("createEvent")}
            </Link>
          </CardContent>
        </Card>
        <Card className={styles.summaryCard}>
          <CardHeader>
            <CardTitle>{t("familyActivity")}</CardTitle>
          </CardHeader>
          <CardContent className={styles.cardBody}>
            {!familyLists.length ? (
              <div className={styles.emptyContent}>
                <span className={styles.emptyIcon}>
                  <OccasionIcon kind="people" />
                </span>
                <p>{t("noActivity")}</p>
              </div>
            ) : (
              <ul className={styles.entries}>
                {familyLists.map((list) => (
                  <li key={list.id}>
                    <Link href={"/dashboard/wishlists/" + list.id}>
                      {list.name}
                    </Link>
                    <p>
                      {w("byOwner", { name: list.owner.name || c("unknown") })}{" "}
                      · {w("itemsCount", { count: list._count.items })}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            <Link
              className={`primary-link ${styles.cardAction}`}
              href="/dashboard/family"
            >
              <span aria-hidden="true">+</span>
              {t("invite")}
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

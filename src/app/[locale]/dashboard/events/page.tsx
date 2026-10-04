import styles from "./page.module.css";
import { Link } from "@/i18n/routing";
import { getEvents } from "@/app/actions/event";
import { getMyFamilies } from "@/app/actions/family";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/Card";
import { CreateEventForm } from "@/components/events/CreateEventForm";
import { getTranslations, getLocale } from "next-intl/server";

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const past = (await searchParams).period === "past";
  const events = await getEvents(past);
  const families = await getMyFamilies();
  const t = await getTranslations("events");
  const locale = await getLocale();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t("title")}</h1>
      </header>
      <nav className="button-row" aria-label={t("period")}>
        <Link
          href="/dashboard/events"
          aria-current={!past ? "page" : undefined}
        >
          {t("upcoming")}
        </Link>
        <Link
          href="/dashboard/events?period=past"
          aria-current={past ? "page" : undefined}
        >
          {t("past")}
        </Link>
      </nav>

      <div className={styles.grid}>
        <div className={styles.mainContent}>
          {events.length === 0 ? (
            <Card className={styles.emptyCard}>
              <CardContent className={styles.emptyContent}>
                <p>{t("empty")}</p>
              </CardContent>
            </Card>
          ) : (
            events.map((event) => (
              <Card key={event.id} className={styles.eventCard}>
                <CardHeader>
                  <CardTitle>{event.name}</CardTitle>
                  <CardDescription>
                    {new Intl.DateTimeFormat(locale, {
                      dateStyle: "long",
                      timeZone: "UTC",
                    }).format(event.date)}{" "}
                    • {event.family.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href={`/dashboard/events/${event.id}`}>
                    {t("view")}
                  </Link>
                  {event.description && (
                    <p className={styles.description}>{event.description}</p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div className={styles.sideContent}>
          <CreateEventForm families={families} />
        </div>
      </div>
    </div>
  );
}

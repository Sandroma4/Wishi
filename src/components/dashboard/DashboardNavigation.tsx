"use client";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import styles from "@/app/[locale]/dashboard/layout.module.css";
const destinations = [
  ["/dashboard", "navHome", "⌂"],
  ["/dashboard/wishlists", "myWishlists", "🎁"],
  ["/dashboard/reservations", "myReservations", "✓"],
  ["/dashboard/family", "navFamily", "♧"],
  ["/dashboard/events", "navEvents", "📅"],
  ["/dashboard/feedback", "navFeedback", "✉"],
] as const;
export function DashboardNavigation() {
  const path = usePathname(),
    t = useTranslations("dashboard");
  return (
    <nav className={styles.nav} aria-label={t("title")}>
      {destinations.map(([href, key, icon]) => {
        const active =
          href === "/dashboard"
            ? path === href
            : path === href || path.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            prefetch={true}
            className={`${styles.navItem} ${href === "/dashboard/feedback" ? styles.mobileAuxiliary : ""}`}
            aria-current={active ? "page" : undefined}
          >
            <span aria-hidden="true">{icon}</span>
            <span className={styles.navLabel}>{t(key)}</span>
          </Link>
        );
      })}
    </nav>
  );
}

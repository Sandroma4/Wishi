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
            className={styles.navItem}
            aria-current={active ? "page" : undefined}
          >
            <span aria-hidden="true">{icon}</span>
            {t(key)}
          </Link>
        );
      })}
    </nav>
  );
}
export function DashboardPageTitle() {
  const path = usePathname(),
    t = useTranslations("dashboard"),
    w = useTranslations("wishlist");
  const key = path.startsWith("/dashboard/events/")
    ? "navEvents"
    : destinations.find(([href]) => href === path)?.[1] || "myProfile";
  const title =
    path === "/dashboard/wishlists/create"
      ? t("newWishlist")
      : path.startsWith("/dashboard/wishlists/")
        ? w("viewList")
        : t(key);
  return <span className={styles.pageTitle}>{title}</span>;
}

import { BrandLogo } from "@/components/ui/BrandLogo";
import { OccasionIcon } from "@/components/ui/OccasionIcon";
import styles from "./page.module.css";
import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
export default async function Home() {
  const t = await getTranslations("home");
  return (
    <main className={styles.container}>
      <div className={styles.brand}>
        <BrandLogo />
      </div>
      <div className={styles.illustration} aria-hidden="true">
        <OccasionIcon kind="gift" />
      </div>
      <header className={styles.header}>
        <h1>{t("title")}</h1>
        <p>{t("description")}</p>
      </header>
      <section className={styles.content}>
        <Link href="/register" className={styles.button}>
          {t("getStarted")}
        </Link>
        <Link href="/login" className={styles.secondaryButton}>
          {t("signIn")}
        </Link>
      </section>
      <section className={styles.benefits} aria-label={t("benefits")}>
        {["wishes", "duplicates", "surprise"].map((key) => (
          <article key={key}>
            <h2>{t(key + "Title")}</h2>
            <p>{t(key + "Help")}</p>
          </article>
        ))}
      </section>
      <section className={styles.example} aria-labelledby="example-title">
        <div>
          <span className={styles.badge}>{t("exampleBadge")}</span>
          <h2 id="example-title">{t("exampleTitle")}</h2>
          <p>{t("exampleHelp")}</p>
        </div>
        <ul>
          {["book", "headphones", "weekend"].map((key) => (
            <li key={key}>
              <OccasionIcon kind="gift" />
              <span>{t("example" + key)}</span>
              <span className={styles.badge}>
                {t(
                  key === "book"
                    ? "available"
                    : key === "headphones"
                      ? "reserved"
                      : "group",
                )}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

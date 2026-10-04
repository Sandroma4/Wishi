import styles from "./page.module.css";
import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
export default async function Home() {
  const t = await getTranslations("home");
  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <h1>{t("title")}</h1>
        <p>{t("description")}</p>
      </header>
      <section className={styles.content}>
        <Link href="/register" className={styles.button}>
          {t("getStarted")}
        </Link>
        <Link href="/login">{t("orSignIn")}</Link>
      </section>
    </main>
  );
}

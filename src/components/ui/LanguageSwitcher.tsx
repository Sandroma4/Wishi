"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";
import { useTransition } from "react";
import styles from "./LanguageSwitcher.module.css";

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function switchLocale(nextLocale: "fr" | "en") {
    if (locale === nextLocale) return;

    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  }

  return (
    <div
      className={`${styles.toggleContainer} ${isPending ? styles.pending : ""}`}
    >
      <button
        type="button"
        className={`${styles.toggleBtn} ${locale === "fr" ? styles.active : ""}`}
        onClick={() => switchLocale("fr")}
        disabled={isPending}
      >
        FR
      </button>
      <button
        type="button"
        className={`${styles.toggleBtn} ${locale === "en" ? styles.active : ""}`}
        onClick={() => switchLocale("en")}
        disabled={isPending}
      >
        EN
      </button>
    </div>
  );
}

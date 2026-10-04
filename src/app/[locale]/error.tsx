"use client";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
export default function ErrorPage({ retry }: { retry: () => void }) {
  const t = useTranslations("errors");
  const c = useTranslations("common");
  return (
    <main className="public-container stack">
      <h1>{t("unexpected")}</h1>
      <Button onClick={() => retry()}>{c("retry")}</Button>
    </main>
  );
}

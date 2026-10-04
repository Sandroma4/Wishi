"use client";
import { useTranslations } from "next-intl";

export default function DashboardLoading() {
  const t = useTranslations("navigationLoading");
  return (
    <div
      className="page-loading"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="sr-only">{t("label")}</span>
      <div className="loading-line loading-heading" aria-hidden="true" />
      <div className="loading-line loading-description" aria-hidden="true" />
      <div className="loading-placeholder" aria-hidden="true">
        <div className="loading-line" />
        <div className="loading-line" />
        <div className="loading-line" />
      </div>
    </div>
  );
}

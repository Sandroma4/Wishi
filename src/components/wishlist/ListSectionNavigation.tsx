"use client";
import { useTranslations } from "next-intl";
export function ListSectionNavigation({ editable }: { editable: boolean }) {
  const t = useTranslations("listNavigation");
  const sections = ["gifts", ...(editable ? ["share"] : [])];
  return (
    <nav className="button-row list-sections" aria-label={t("sections")}>
      {sections.map((key) => (
        <a
          key={key}
          href={"#list-" + key}
          onClick={() => {
            const target = document.getElementById("list-" + key);
            if (target instanceof HTMLDetailsElement) target.open = true;
          }}
        >
          {t(key)}
        </a>
      ))}
    </nav>
  );
}

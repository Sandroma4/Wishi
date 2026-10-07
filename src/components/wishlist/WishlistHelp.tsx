import { getTranslations } from "next-intl/server";
export async function WishlistHelp({ open = false }: { open?: boolean }) {
  const t = await getTranslations("usageHelp");
  return (
    <details className="usage-help" open={open}>
      <summary>
        <span aria-hidden="true">ⓘ </span>
        {t("title")}
      </summary>
      <dl className="stack">
        {["private", "family", "link", "public", "group"].map((key) => (
          <div key={key}>
            <dt>
              <strong>{t(key + "Title")}</strong>
            </dt>
            <dd>{t(key + "Help")}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}

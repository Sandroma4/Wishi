import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
export default async function NotFound() {
  const t = await getTranslations("common");
  return (
    <main className="public-container stack">
      <h1>{t("notFound")}</h1>
      <Link href="/">{t("backHome")}</Link>
    </main>
  );
}

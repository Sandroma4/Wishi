import { BrandLogo } from "@/components/ui/BrandLogo";
import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";

export async function PublicListHeader() {
  const t = await getTranslations("publicList");
  return (
    <header className="public-list-header">
      <Link href="/" aria-label={t("home")}>
        <BrandLogo />
      </Link>
      <p>{t("help")}</p>
    </header>
  );
}

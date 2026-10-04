import { cookies } from "next/headers";
import { ThemeSwitcher } from "@/components/ui/ThemeSwitcher";
import styles from "./layout.module.css";
import { Link } from "@/i18n/routing";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { DashboardNavigation } from "@/components/dashboard/DashboardNavigation";
export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/" + locale + "/login");
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true },
  });
  if (!user) redirect("/" + locale + "/login");
  const t = await getTranslations("dashboard");
  const choice = (await cookies()).get("wishi-theme")?.value;
  const theme = choice === "light" || choice === "dark" ? choice : "system";
  return (
    <div className={styles.dashboard}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <h2>Wishi</h2>
        </div>
        <DashboardNavigation />
        <details className={styles.settings}>
          <summary>{t("displaySettings")}</summary>
          <div className={styles.settingsPanel}>
            <Link href="/dashboard/profile">{t("myProfile")}</Link>
            <LanguageSwitcher />
            <ThemeSwitcher initial={theme} />
            <Link href="/dashboard/feedback">{t("navFeedback")}</Link>
            <SignOutButton />
          </div>
        </details>
        <Link href="/dashboard/profile" className={styles.profile}>
          <div className={styles.avatar}>
            {user.name?.[0]?.toUpperCase() || "U"}
          </div>
          <span className={styles.userName}>{user.name || t("myProfile")}</span>
        </Link>
      </aside>
      <main className={styles.main}>
        <div className={styles.content}>{children}</div>
      </main>
    </div>
  );
}

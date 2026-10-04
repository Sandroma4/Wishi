import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import { AcceptInvitation } from "@/components/family/AcceptInvitation";
export const metadata = { robots: { index: false, follow: false } };
export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string; locale: string }>;
}) {
  const { token, locale } = await params;
  const t = await getTranslations("family");
  const errors = await getTranslations("errors");
  const invitation = await prisma.invitation.findUnique({
    where: { token },
    select: { expires: true, family: { select: { name: true } } },
  });
  const session = await auth();
  return (
    <main className="public-container stack">
      <h1>{t("invitationTitle")}</h1>
      {!invitation || invitation.expires <= new Date() ? (
        <p role="alert">{errors("invalidInvitation")}</p>
      ) : (
        <>
          <p>{t("invitationFor", { name: invitation.family.name })}</p>
          {session?.user?.id ? (
            <AcceptInvitation token={token} />
          ) : (
            <Link
              href={{
                pathname: "/login",
                query: { next: "/" + locale + "/invite/" + token },
              }}
            >
              {t("signInToJoin")}
            </Link>
          )}
        </>
      )}
    </main>
  );
}

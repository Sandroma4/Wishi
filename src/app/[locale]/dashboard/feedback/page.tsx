import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { FeedbackForm } from "@/components/dashboard/FeedbackForm";
export default async function FeedbackPage() {
  const session = await auth(),
    locale = await getLocale();
  if (!session?.user?.id) redirect("/" + locale + "/login");
  const t = await getTranslations("feedback");
  const reports = await prisma.feedback.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { id: true, message: true, status: true, createdAt: true },
  });
  return (
    <div className="stack focused-page">
      <h1>{t("title")}</h1>
      <p>{t("intro")}</p>
      <FeedbackForm />
      <h2>{t("history")}</h2>
      {!reports.length && <p>{t("empty")}</p>}
      <ul className="stack">
        {reports.map((report) => (
          <li key={report.id}>
            <p>
              {new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
                report.createdAt,
              )}{" "}
              · {t(report.status === "RESOLVED" ? "resolved" : "open")}
            </p>
            <p style={{ whiteSpace: "pre-wrap" }}>{report.message}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

import { getPendingInvitations } from "@/app/actions/family";
import { getLocale, getTranslations } from "next-intl/server";
import { InvitationControls } from "./InvitationControls";
export async function PendingInvitations({ familyId }: { familyId: string }) {
  const invitations = await getPendingInvitations(familyId);
  const locale = await getLocale(),
    t = await getTranslations("family");
  return (
    <section className="stack">
      <h3>{t("pendingInvitations")}</h3>
      {!invitations.length && <p>{t("noPendingInvitations")}</p>}
      <ul className="stack">
        {invitations.map((invitation) => (
          <li key={invitation.id}>
            <div className="stack">
              <p className="break-word">{invitation.email}</p>
              <p>
                {t("expiresOn", {
                  date: new Intl.DateTimeFormat(locale, {
                    dateStyle: "long",
                    timeZone: "UTC",
                  }).format(invitation.expires),
                })}
              </p>
              <InvitationControls id={invitation.id} token={invitation.token} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

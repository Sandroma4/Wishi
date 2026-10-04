"use client";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { cancelInvitation } from "@/app/actions/family";
import { ShareLink } from "@/components/ui/ShareLink";
import { Button } from "@/components/ui/Button";
export function InvitationControls({
  id,
  token,
}: {
  id: string;
  token: string;
}) {
  const locale = useLocale(),
    t = useTranslations("family"),
    errors = useTranslations("errors");
  const router = useRouter();
  const [pending, setPending] = useState(false),
    [message, setMessage] = useState("");
  const href = `/invite/${token}`;
  async function revoke() {
    if (!window.confirm(t("confirmRevoke"))) return;
    setPending(true);
    setMessage("");
    try {
      const result = await cancelInvitation(id);
      if (result.error) setMessage(errors(result.error));
      else router.refresh();
    } catch {
      setMessage(errors("unexpected"));
    } finally {
      setPending(false);
    }
  }
  return (
    <div className="stack">
      <ShareLink
        key={token}
        href={"/" + locale + href}
        title="Wishi"
        help={t("invitationShareHelp")}
      />
      <div className="button-row">
        <Button variant="danger" onClick={revoke} disabled={pending}>
          {t("revokeInvitation")}
        </Button>
      </div>
      {message && <p role="status">{message}</p>}
    </div>
  );
}

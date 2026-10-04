"use client";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/routing";
import { cancelInvitation } from "@/app/actions/family";
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
    c = useTranslations("common"),
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
  async function copy() {
    try {
      await navigator.clipboard.writeText(
        window.location.origin + "/" + locale + href,
      );
      setMessage(c("copied"));
    } catch {
      setMessage(errors("unexpected"));
    }
  }
  return (
    <div className="stack">
      <Link className="break-word" href={href}>
        {t("openInvitation")}
      </Link>
      <div className="button-row">
        <Button variant="secondary" onClick={copy} disabled={pending}>
          {c("copy")}
        </Button>
        <Button variant="danger" onClick={revoke} disabled={pending}>
          {t("revokeInvitation")}
        </Button>
      </div>
      {message && <p role="status">{message}</p>}
    </div>
  );
}

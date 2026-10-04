"use client";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { changeShareLink } from "@/app/actions/wishlist";
import { Button } from "@/components/ui/Button";
import { ShareLink } from "@/components/ui/ShareLink";
export function WishlistManager({
  id,
  visibility,
  token,
}: {
  id: string;
  visibility: string;
  token: string | null;
}) {
  const t = useTranslations("wishlist");
  const help = useTranslations("usageHelp");
  const flow = useTranslations("dailyFlow");
  const errors = useTranslations("errors");
  const locale = useLocale();
  const router = useRouter();
  const link = token ? "/" + locale + "/share/" + token : "";
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  async function share(revoke: boolean) {
    setPending(true);
    setMessage("");
    try {
      const result = await changeShareLink(id, revoke);
      if (result.error) setMessage(errors(result.error));
      router.refresh();
    } catch {
      setMessage(errors("unexpected"));
    } finally {
      setPending(false);
    }
  }
  return (
    <section
      className="stack gift-preview"
      aria-busy={pending}
      aria-label={flow("sharingTitle")}
    >
      <h2>{flow("sharingTitle")}</h2>
      <p>{help(visibility.toLowerCase() + "Help")}</p>
      {visibility === "FAMILY" && (
        <Link className="primary-link" href="/dashboard/family">
          {flow("inviteFamily")}
        </Link>
      )}
      {visibility === "PRIVATE" && <p>{flow("privateSharing")}</p>}
      {visibility === "PUBLIC" && (
        <ShareLink href={"/" + locale + "/lists/" + id} title="Wishi" />
      )}
      {visibility === "LINK" && (
        <>
          <p>{t("shareHelp")}</p>
          <div className="button-row">
            <Button
              variant={link ? "secondary" : "primary"}
              disabled={pending}
              onClick={() => share(false)}
            >
              {t("share")}
            </Button>
            {link && (
              <Button
                disabled={pending}
                variant="secondary"
                onClick={() => share(true)}
              >
                {t("revoke")}
              </Button>
            )}
          </div>
          {link && <ShareLink key={link} href={link} title="Wishi" />}
        </>
      )}
      {message && <p role="status">{message}</p>}
    </section>
  );
}

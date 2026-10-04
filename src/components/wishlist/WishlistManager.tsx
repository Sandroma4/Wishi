"use client";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
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
    <div className="stack" aria-busy={pending}>
      {visibility === "PUBLIC" && (
        <ShareLink
          href={"/" + locale + "/lists/" + id}
          title="Wishi"
          help={t("publicShareHelp")}
        />
      )}
      {visibility === "LINK" && (
        <>
          <p>{t("shareHelp")}</p>
          <div className="button-row">
            <Button disabled={pending} onClick={() => share(false)}>
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
    </div>
  );
}

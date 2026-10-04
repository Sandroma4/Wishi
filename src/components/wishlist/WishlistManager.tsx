"use client";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { changeShareLink } from "@/app/actions/wishlist";
import { Button } from "@/components/ui/Button";
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
  const c = useTranslations("common");
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
    <div className="stack">
      {visibility === "PUBLIC" && (
        <a href={"/" + locale + "/lists/" + id}>{t("viewList")}</a>
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
          {link && (
            <>
              <a className="break-word" href={link}>
                {link}
              </a>
              <Button
                variant="secondary"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(
                      window.location.origin + link,
                    );
                    setMessage(c("copied"));
                  } catch {
                    setMessage(errors("unexpected"));
                  }
                }}
              >
                {c("copy")}
              </Button>
            </>
          )}
        </>
      )}
      {message && <p role="status">{message}</p>}
    </div>
  );
}

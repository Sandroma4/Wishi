"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { restoreWishlistItem } from "@/app/actions/item";
import { Button } from "@/components/ui/Button";
export function GiftTrash({
  gifts,
}: {
  gifts: { id: string; title: string }[];
}) {
  const t = useTranslations("giftTrash"),
    errors = useTranslations("errors"),
    router = useRouter();
  const [pending, setPending] = useState<string | null>(null),
    [message, setMessage] = useState("");
  if (!gifts.length) return null;
  return (
    <details className="gift-trash">
      <summary>{t("title", { count: gifts.length })}</summary>
      <div className="stack">
        <p>{t("help")}</p>
        {gifts.map((gift) => (
          <div className="trash-gift" key={gift.id}>
            <span>{gift.title}</span>
            <Button
              variant="secondary"
              disabled={pending !== null}
              onClick={async () => {
                setPending(gift.id);
                setMessage("");
                try {
                  const result = await restoreWishlistItem(gift.id);
                  if (result.error) setMessage(errors(result.error));
                  else {
                    setMessage(t("restored", { name: gift.title }));
                    router.refresh();
                  }
                } catch {
                  setMessage(errors("unexpected"));
                } finally {
                  setPending(null);
                }
              }}
            >
              {t(pending === gift.id ? "restoring" : "restore")}
            </Button>
          </div>
        ))}
        {message && <p role="status">{message}</p>}
      </div>
    </details>
  );
}

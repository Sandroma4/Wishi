"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { checkGiftLinks } from "@/app/actions/merchant-links";
import { Button } from "@/components/ui/Button";
export function MerchantLinks({ itemId }: { itemId: string }) {
  const t = useTranslations("improvements");
  const [pending, setPending] = useState(false),
    [message, setMessage] = useState("");
  const [results, setResults] = useState<{ url: string; status: string }[]>([]);
  return (
    <div className="stack merchant-check">
      <Button
        variant="secondary"
        disabled={pending}
        onClick={async () => {
          setPending(true);
          setMessage("");
          try {
            const response = await checkGiftLinks(itemId);
            if (response.results) setResults(response.results);
            else
              setMessage(
                t(response.error === "retryLater" ? "retry" : "linkUnknown"),
              );
          } catch {
            setMessage(t("linkUnknown"));
          } finally {
            setPending(false);
          }
        }}
      >
        {pending ? t("working") : t("checkLinks")}
      </Button>
      {!!results.length && (
        <ul aria-live="polite">
          {results.map((result, index) => (
            <li key={result.url}>
              {t("linkNumber", { number: index + 1 })} :{" "}
              {t(
                "link" +
                  result.status[0].toUpperCase() +
                  result.status.slice(1),
              )}
            </li>
          ))}
        </ul>
      )}
      {!!results.length && <p className="form-hint">{t("replaceLinkHelp")}</p>}
      <p role="status">{message}</p>
    </div>
  );
}

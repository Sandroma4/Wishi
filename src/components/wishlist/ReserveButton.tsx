"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { reserveItem, cancelReservation } from "@/app/actions/item";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
export function ReserveButton({
  itemId,
  isReserved,
  reservedByMe,
  token,
}: {
  itemId: string;
  isReserved: boolean;
  reservedByMe: boolean;
  token?: string;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const t = useTranslations("wishlist");
  const errors = useTranslations("errors");
  async function click() {
    setPending(true);
    setError("");
    try {
      const result = reservedByMe
        ? await cancelReservation(itemId)
        : await reserveItem(itemId, token);
      if (result.error) setError(errors(result.error));
      router.refresh();
    } catch {
      setError(errors("unexpected"));
    } finally {
      setPending(false);
    }
  }
  return (
    <div className="stack">
      <Button
        disabled={pending || (isReserved && !reservedByMe)}
        variant={isReserved ? "secondary" : "primary"}
        onClick={click}
      >
        {pending
          ? "…"
          : t(
              reservedByMe
                ? "cancelReservation"
                : isReserved
                  ? "reserved"
                  : "reserve",
            )}
      </Button>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}

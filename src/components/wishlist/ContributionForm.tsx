"use client";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import {
  saveContribution,
  removeContribution,
} from "@/app/actions/contribution";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
export function ContributionForm({
  itemId,
  mine = 0,
  total,
  target,
  token,
  cancelOnly = false,
}: {
  itemId: string;
  mine?: number;
  total?: number;
  target?: number;
  token?: string;
  cancelOnly?: boolean;
}) {
  const t = useTranslations("contributions"),
    errors = useTranslations("errors"),
    locale = useLocale(),
    router = useRouter();
  const [pending, setPending] = useState(false),
    [message, setMessage] = useState("");
  const money = (cents: number) =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "EUR",
    }).format(cents / 100);
  async function perform(amount?: string) {
    setPending(true);
    setMessage("");
    try {
      const result =
        amount === undefined
          ? await removeContribution(itemId)
          : await saveContribution(itemId, amount, token);
      if ("error" in result && result.error) setMessage(errors(result.error));
      else {
        setMessage(t(amount === undefined ? "cancelled" : "saved"));
        router.refresh();
      }
    } catch {
      setMessage(errors("unexpected"));
    } finally {
      setPending(false);
    }
  }
  return (
    <section className="stack" aria-busy={pending}>
      <p>{t("help")}</p>
      {total !== undefined && target !== undefined && (
        <p>{t("progress", { total: money(total), target: money(target) })}</p>
      )}
      {!!mine && <p>{t("mine", { amount: money(mine) })}</p>}
      {!cancelOnly &&
        target !== undefined &&
        total !== undefined &&
        total >= target &&
        !mine && <p>{t("complete")}</p>}
      {!cancelOnly &&
        (target === undefined || (total || 0) - mine < target) && (
          <form
            className="stack"
            action={(form) => perform(String(form.get("amount") || ""))}
          >
            <Input
              name="amount"
              label={t("amount")}
              type="number"
              min="0.01"
              step="0.01"
              max={
                target !== undefined
                  ? Math.max(0, (target - (total || 0) + mine) / 100)
                  : 9999999.99
              }
              defaultValue={mine ? (mine / 100).toFixed(2) : ""}
              required
            />
            <Button disabled={pending}>{t(mine ? "update" : "join")}</Button>
          </form>
        )}
      {!!mine && (
        <Button
          type="button"
          variant="secondary"
          disabled={pending}
          onClick={() => perform()}
        >
          {t("cancel")}
        </Button>
      )}
      <p role="status">{message}</p>
    </section>
  );
}

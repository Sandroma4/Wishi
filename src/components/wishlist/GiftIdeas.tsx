"use client";
import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { GiftBrowser } from "./GiftBrowser";
import type { SearchableGift } from "@/lib/gift-search";
export function GiftIdeas({
  gifts,
}: {
  gifts: (SearchableGift & {
    recipient: string;
    event: string;
    card: ReactNode;
  })[];
}) {
  const t = useTranslations("convenience"),
    [recipient, setRecipient] = useState(""),
    [event, setEvent] = useState("");
  return (
    <div className="stack">
      <h1>{t("ideas")}</h1>
      <p>{t("ideasHelp")}</p>
      <div className="gift-filters">
        <label>
          {t("recipient")}
          <select
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
          >
            <option value="">{t("allRecipients")}</option>
            {[...new Set(gifts.map((g) => g.recipient))].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        <label>
          {t("event")}
          <select value={event} onChange={(e) => setEvent(e.target.value)}>
            <option value="">{t("allEvents")}</option>
            {[...new Set(gifts.map((g) => g.event).filter(Boolean))].map(
              (v) => (
                <option key={v}>{v}</option>
              ),
            )}
          </select>
        </label>
      </div>
      <GiftBrowser
        key={JSON.stringify([recipient, event])}
        owner={false}
        gifts={gifts.filter(
          (g) =>
            (!recipient || g.recipient === recipient) &&
            (!event || g.event === event),
        )}
      />
    </div>
  );
}

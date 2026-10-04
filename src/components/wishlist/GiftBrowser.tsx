"use client";
import { useId, useState, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  selectGifts,
  giftTotals,
  type SearchableGift,
  type GiftFilters,
} from "@/lib/gift-search";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
const initial: GiftFilters = {
  query: "",
  maxPrice: "",
  priority: "all",
  status: "all",
  sort: "recent",
};
export function GiftBrowser({
  gifts,
  owner,
}: {
  gifts: (SearchableGift & { card: ReactNode })[];
  owner: boolean;
}) {
  const t = useTranslations("giftSearch");
  const flow = useTranslations("uiFlow");
  const w = useTranslations("wishlist");
  const locale = useLocale();
  const id = useId();
  const [filters, setFilters] = useState(initial);
  const change = (key: keyof GiftFilters, value: string) =>
    setFilters((current) => ({ ...current, [key]: value }));
  const mixedCurrencies =
    new Set(
      gifts
        .filter((gift) => gift.priceCents !== null)
        .map((gift) => gift.currency || "EUR"),
    ).size > 1;
  const visible = selectGifts(
    gifts,
    mixedCurrencies ? { ...filters, maxPrice: "" } : filters,
    owner,
    locale,
  );
  const { totals, unpriced } = giftTotals(visible);
  return (
    <div className="stack gift-browser">
      <div className="gift-summary">
        <p>
          {t("total")}:{" "}
          {Object.entries(totals)
            .map(([currency, cents]) =>
              new Intl.NumberFormat(locale, {
                style: "currency",
                currency,
              }).format(cents / 100),
            )
            .join(" + ") || "—"}
        </p>
        {unpriced > 0 && <p>{t("unpriced", { count: unpriced })}</p>}
        {mixedCurrencies && <p>{t("currencies")}</p>}
      </div>

      <div className="gift-filters" role="search" aria-label={t("title")}>
        <div className="list-search gift-search">
          <label htmlFor={id + "-search"}>{t("search")}</label>
          <div className="list-search-field">
            <svg
              aria-hidden="true"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
            >
              <circle cx="10.5" cy="10.5" r="6.5" />
              <path d="m16 16 4 4" />
            </svg>
            <input
              id={id + "-search"}
              type="search"
              value={filters.query}
              onChange={(e) => change("query", e.target.value)}
              maxLength={120}
            />
          </div>
        </div>
        <div className="stack">
          <label htmlFor={id + "-sort"}>{t("sort")}</label>
          <select
            id={id + "-sort"}
            value={filters.sort}
            onChange={(e) => change("sort", e.target.value)}
          >
            {["recent", "priority", "priceAsc", "priceDesc", "name"].map(
              (value) => (
                <option key={value} value={value}>
                  {t(value)}
                </option>
              ),
            )}
          </select>
        </div>
      </div>
      <details className="form-options list-detail-options">
        <summary>
          {flow("moreFilters")}{" "}
          {(filters.maxPrice ||
            filters.priority !== "all" ||
            filters.status !== "all") && <span>· {flow("filtersActive")}</span>}
        </summary>
        <div className="gift-filters">
          {!mixedCurrencies && (
            <Input
              id={id + "-budget"}
              label={t("budget", {
                currency:
                  gifts.find((gift) => gift.priceCents !== null)?.currency ||
                  "EUR",
              })}
              type="number"
              min="0"
              step="0.01"
              value={filters.maxPrice}
              onChange={(e) => change("maxPrice", e.target.value)}
            />
          )}
          <div className="stack">
            <label htmlFor={id + "-priority"}>{w("priority")}</label>
            <select
              id={id + "-priority"}
              value={filters.priority}
              onChange={(e) => change("priority", e.target.value)}
            >
              <option value="all">{t("allPriorities")}</option>
              {["LOW", "NORMAL", "HIGH", "ESSENTIAL"].map((value) => (
                <option key={value} value={value}>
                  {w("priority" + value[0] + value.slice(1).toLowerCase())}
                </option>
              ))}
            </select>
          </div>
          {!owner && (
            <div className="stack">
              <label htmlFor={id + "-status"}>{t("status")}</label>
              <select
                id={id + "-status"}
                value={filters.status}
                onChange={(e) => change("status", e.target.value)}
              >
                {["all", "available", "mine"].map((value) => (
                  <option key={value} value={value}>
                    {t(value)}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </details>
      <div className="button-row">
        <Button
          variant="secondary"
          aria-pressed={filters.priority === "ESSENTIAL"}
          onClick={() =>
            change(
              "priority",
              filters.priority === "ESSENTIAL" ? "all" : "ESSENTIAL",
            )
          }
        >
          {t("quickEssential")}
        </Button>
        {!owner && (
          <Button
            variant="secondary"
            aria-pressed={filters.status === "available"}
            onClick={() =>
              change(
                "status",
                filters.status === "available" ? "all" : "available",
              )
            }
          >
            {t("available")}
          </Button>
        )}
        <Button variant="secondary" onClick={() => setFilters(initial)}>
          {t("reset")}
        </Button>
        <p role="status">
          {t("shown", { count: visible.length, total: gifts.length })}
        </p>
      </div>
      {!visible.length && <p>{t("noResults")}</p>}
      <div className="gift-grid">
        {visible.map((gift) => (
          <div key={gift.id}>{gift.card}</div>
        ))}
      </div>
    </div>
  );
}

export type SearchableGift = {
  id: string;
  title: string;
  description?: string | null;
  size?: string | null;
  color?: string | null;
  model?: string | null;
  priceCents: number | null;
  currency: string | null;
  priority: string;
  isReserved: boolean;
  reservedByMe: boolean;
};
export function paginateGifts<T>(items: T[], requested: number, size = 24) {
  const pages = Math.max(1, Math.ceil(items.length / size));
  const page = Math.min(pages, Math.max(1, Number.isFinite(requested) ? Math.trunc(requested) : 1));
  return { page, pages, items: items.slice((page - 1) * size, page * size) };
}
export type GiftFilters = {
  query: string;
  maxPrice: string;
  priority: string;
  status: string;
  sort: string;
};
const normalize = (value: string) =>
  value.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase();
export function selectGifts<T extends SearchableGift>(
  items: T[],
  filters: GiftFilters,
  owner: boolean,
  locale: string,
) {
  const query = normalize(filters.query.trim());
  const max = filters.maxPrice.trim() === "" ? null : Number(filters.maxPrice);
  const selected = items.filter(
    (item) =>
      (!query ||
        normalize(
          [item.title, item.description, item.size, item.color, item.model]
            .filter(Boolean)
            .join(" "),
        ).includes(query)) &&
      (max === null ||
        (Number.isFinite(max) &&
          max >= 0 &&
          item.priceCents !== null &&
          item.priceCents <= Math.round(max * 100))) &&
      (filters.priority === "all" || item.priority === filters.priority) &&
      (owner ||
        filters.status === "all" ||
        (filters.status === "available"
          ? !item.isReserved
          : item.reservedByMe)),
  );
  const collator = new Intl.Collator(locale, {
    sensitivity: "base",
    numeric: true,
  });
  const rank: Record<string, number> = {
    ESSENTIAL: 4,
    HIGH: 3,
    NORMAL: 2,
    LOW: 1,
  };
  return selected.sort((a, b) => {
    if (filters.sort === "name") return collator.compare(a.title, b.title);
    if (filters.sort === "priority")
      return (rank[b.priority] || 0) - (rank[a.priority] || 0);
    if (["priceAsc", "priceDesc"].includes(filters.sort)) {
      if (a.priceCents === null) return b.priceCents === null ? 0 : 1;
      if (b.priceCents === null) return -1;
      // Prices in different currencies cannot be meaningfully compared without exchange rates.
      const currency = collator.compare(
        a.currency || "EUR",
        b.currency || "EUR",
      );
      return (
        currency ||
        (filters.sort === "priceAsc"
          ? a.priceCents - b.priceCents
          : b.priceCents - a.priceCents)
      );
    }
    return 0;
  });
}
export function giftTotals(items: SearchableGift[]) {
  const totals: Record<string, number> = {};
  let unpriced = 0;
  for (const item of items) {
    if (item.priceCents === null) unpriced++;
    else {
      const currency = item.currency || "EUR";
      totals[currency] = (totals[currency] || 0) + item.priceCents;
    }
  }
  return { totals, unpriced };
}

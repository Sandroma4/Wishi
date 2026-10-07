export function sharedProduct(input: {
  url?: string;
  text?: string;
  title?: string;
}) {
  const candidate =
    input.url || input.text?.match(/https?:\/\/[^\s<>]+/)?.[0] || "";
  let url = "";
  try {
    const parsed = new URL(candidate);
    if (
      ["http:", "https:"].includes(parsed.protocol) &&
      candidate.length <= 2048 &&
      !parsed.username &&
      !parsed.password
    )
      url = candidate;
  } catch {}
  return { url, title: (input.title || "").trim().slice(0, 120) };
}
export function ownerPreview<
  T extends {
    isOwner: boolean;
    canEdit: boolean;
    items: {
      isReserved: boolean;
      reservedByMe: boolean;
      contributedCents: number;
      myContributionCents: number;
    }[];
  },
>(list: T): T {
  return {
    ...list,
    canEdit: false,
    items: list.items.map((item) => ({
      ...item,
      isReserved: false,
      reservedByMe: false,
      contributedCents: 0,
      myContributionCents: 0,
    })),
  };
}

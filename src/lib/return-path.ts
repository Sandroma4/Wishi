export function returnPath(value: unknown, locale: string) {
  if (typeof value === "string" && value.length <= 5000) {
    try {
      const parsed = new URL(value, "https://local.invalid");
      if (
        parsed.origin === "https://local.invalid" &&
        /^\/(fr|en)\/quick-add$/.test(parsed.pathname) &&
        !parsed.hash &&
        [...parsed.searchParams.keys()].every((key) =>
          ["url", "title", "text"].includes(key),
        )
      )
        return parsed.pathname + parsed.search;
    } catch {}
  }
  return typeof value === "string" &&
    new RegExp("^/(fr|en)/(invite|share|lists)/[A-Za-z0-9_-]+$").test(value)
    ? value
    : "/" + locale + "/dashboard";
}

export function returnPath(value: unknown, locale: string) {
  return typeof value === "string" &&
    new RegExp("^/(fr|en)/(invite|share|lists)/[A-Za-z0-9_-]+$").test(value)
    ? value
    : "/" + locale + "/dashboard";
}

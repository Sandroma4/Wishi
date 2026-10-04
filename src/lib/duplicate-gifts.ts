export function canonicalGiftUrl(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (!["https:", "http:"].includes(url.protocol)) return null;
    url.hash = "";
    for (const key of [...url.searchParams.keys()])
      if (/^utm_|^(fbclid|gclid|msclkid)$/i.test(key))
        url.searchParams.delete(key);
    url.searchParams.sort();
    url.hostname = url.hostname.replace(/^www\./, "");
    url.pathname = url.pathname.replace(/\/$/, "") || "/";
    return url.toString().replace(/^https?:\/\//, "");
  } catch {
    return null;
  }
}

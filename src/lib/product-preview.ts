import { lookup } from "node:dns/promises";
import { request } from "node:https";
import { isIP } from "node:net";

// Only public IPv4 destinations are used; pin the checked address to prevent DNS rebinding.
export function publicAddress(address: string) {
  if (isIP(address) !== 4) return false;
  const [a, b] = address.split(".").map(Number);
  return !(
    a === 0 ||
    a === 10 ||
    a === 127 ||
    a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && [0, 168].includes(b)) ||
    (a === 198 && [18, 19, 51].includes(b)) ||
    (a === 203 && b === 0)
  );
}
export function productUrl(value: string) {
  if (value.length > 2048) throw new Error("invalidUrl");
  const url = new URL(value);
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    (url.port && url.port !== "443") ||
    !url.hostname.includes(".") ||
    (isIP(url.hostname) && !publicAddress(url.hostname))
  )
    throw new Error("invalidUrl");
  url.hash = "";
  return url;
}
export async function readPublicResource(
  value: string,
  limit: number,
  kind: "html" | "image",
  hops = 0,
): Promise<{ bytes: Buffer; url: string }> {
  const url = productUrl(value);
  const addresses = await lookup(url.hostname, { all: true, family: 4 });
  if (
    !addresses.length ||
    addresses.some(({ address }) => !publicAddress(address))
  )
    throw new Error("invalidUrl");
  const response = await new Promise<{ bytes?: Buffer; redirect?: string }>(
    (resolve, reject) => {
      const req = request(
        url,
        {
          agent: false,
          family: 4,
          ...{ autoSelectFamily: false },
          lookup: (_host, _options, callback) =>
            callback(null, addresses[0].address, 4),
          headers: {
            "User-Agent": "Cadéoly/1.0 (product preview)",
            Accept:
              kind === "html" ? "text/html" : "image/jpeg,image/png,image/webp",
            "Accept-Encoding": "identity",
          },
        },
        (res) => {
          if (
            [301, 302, 303, 307, 308].includes(res.statusCode || 0) &&
            res.headers.location
          ) {
            res.destroy();
            resolve({
              redirect: new URL(res.headers.location, url).toString(),
            });
            return;
          }
          const type = String(res.headers["content-type"] || "").split(";")[0];
          if (
            res.statusCode !== 200 ||
            !(kind === "html"
              ? ["text/html", "application/xhtml+xml"].includes(type)
              : ["image/jpeg", "image/png", "image/webp"].includes(type))
          ) {
            res.destroy();
            reject(Object.assign(new Error("unsupported"), { status: res.statusCode }));
            return;
          }
          const chunks: Buffer[] = [];
          let size = 0;
          res.on("data", (chunk: Buffer) => {
            size += chunk.length;
            if (size > limit) {
              res.destroy(new Error("tooLarge"));
            } else chunks.push(chunk);
          });
          res.on("error", reject);
          res.on("end", () => resolve({ bytes: Buffer.concat(chunks) }));
        },
      );
      const timer = setTimeout(() => req.destroy(new Error("timeout")), 8000);
      req.on("close", () => clearTimeout(timer));
      req.on("error", reject);
      req.end();
    },
  );
  if (response.redirect) {
    if (hops >= 3) throw new Error("redirects");
    return readPublicResource(response.redirect, limit, kind, hops + 1);
  }
  return { bytes: response.bytes!, url: url.toString() };
}
function decode(value: string) {
  const entities: Record<string, string> = {
    eacute: "é",
    egrave: "è",
    ecirc: "ê",
    agrave: "à",
    acirc: "â",
    ccedil: "ç",
    ocirc: "ô",
    ugrave: "ù",
    ucirc: "û",
    nbsp: " ",
  };
  value = value.replace(
    /&([a-z]+);/gi,
    (match, name) => entities[name.toLowerCase()] || match,
  );
  return value
    .replace(
      /&(?:amp|quot|apos|lt|gt|#39|#(\d+)|#x([0-9a-f]+));/gi,
      (match, decimal, hex) => {
        if (decimal || hex) {
          const code = parseInt(decimal || hex, hex ? 16 : 10);
          return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : "";
        }
        return (
          (
            {
              "&amp;": "&",
              "&quot;": '"',
              "&apos;": "'",
              "&#39;": "'",
              "&lt;": "<",
              "&gt;": ">",
            } as Record<string, string>
          )[match.toLowerCase()] || match
        );
      },
    )
    .replace(/\s+/g, " ")
    .trim();
}
export function parseProduct(html: string, base: string) {
  const meta: Record<string, string> = {};
  for (const tag of html.match(/<meta\b[^>]*>/gi) || []) {
    const attrs: Record<string, string> = {};
    for (const match of tag.matchAll(
      /([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g,
    ))
      attrs[match[1].toLowerCase()] = decode(match[2] ?? match[3] ?? match[4]);
    const key = attrs.property || attrs.name;
    if (key && attrs.content && !meta[key.toLowerCase()])
      meta[key.toLowerCase()] = attrs.content;
  }
  const amazon =
    /(^|\.)amazon\.(fr|com|de|it|es|nl|pl|se|com\.be|co\.uk|ca|com\.au|co\.jp)$/.test(
      new URL(base).hostname,
    );
  if (
    amazon &&
    /(?:id=["']captchacharacters["']|action=["'][^"']*validateCaptcha)/i.test(
      html,
    )
  )
    return { title: "", price: "", image: "" };
  const amazonTitle = amazon
    ? decode(
        html
          .match(
            /<span\b[^>]*\bid=["']productTitle["'][^>]*>([\s\S]*?)<\/span>/i,
          )?.[1]
          .replace(/<[^>]*>/g, " ") || "",
      )
    : "";
  const title = (
    amazonTitle ||
    meta["og:title"] ||
    meta["twitter:title"] ||
    decode(html.match(/<title\b[^>]*>([^<]*)<\/title>/i)?.[1] || "")
  ).slice(0, 120);
  let amazonPrice = "";
  if (amazon) {
    const label =
      html.match(
        /<span\b[^>]*\bid=["']apex-pricetopay-accessibility-label["'][^>]*>([\s\S]*?)<\/span>/i,
      )?.[1] || "";
    const amount = decode(label.replace(/<[^>]*>/g, "")).match(
      /^(\d[\d .]*[,.]\d{2})\s*€$/,
    );
    if (amount) amazonPrice = amount[1].replace(/[ .]/g, "").replace(",", ".");
  }
  const currency = meta["product:price:currency"] || meta["og:price:currency"];
  const rawPrice =
    meta["product:price:amount"] || meta["og:price:amount"] || "";
  let price =
    /^\d+(?:[.,]\d{1,2})?$/.test(rawPrice) &&
    currency === "EUR" &&
    Number(rawPrice.replace(",", ".")) <= 9999999.99
      ? Number(rawPrice.replace(",", ".")).toFixed(2)
      : "";
  if (
    !price &&
    /^\d{1,7}\.\d{2}$/.test(amazonPrice) &&
    Number(amazonPrice) <= 9999999.99
  )
    price = amazonPrice;
  let image = "";
  try {
    const tag = amazon
      ? html.match(/<img\b[^>]*\bid=["']landingImage["'][^>]*>/i)?.[0] || ""
      : "";
    const attr = (name: string) =>
      decode(
        tag
          .match(new RegExp(name + "\\s*=\\s*(?:\"([^\"]*)\"|'([^']*)')", "i"))
          ?.slice(1)
          .find(Boolean) || "",
      );
    let amazonImage = attr("data-old-hires") || attr("src");
    try {
      const candidates = JSON.parse(attr("data-a-dynamic-image") || "{}");
      amazonImage =
        Object.entries(candidates)
          .filter(
            (entry): entry is [string, number[]] =>
              Array.isArray(entry[1]) &&
              entry[1].length === 2 &&
              entry[1].every((value) => typeof value === "number"),
          )
          .sort((a, b) => b[1][0] * b[1][1] - a[1][0] * a[1][1])[0]?.[0] ||
        amazonImage;
    } catch {}
    const raw = meta["og:image"] || meta["twitter:image"] || amazonImage;
    if (raw) image = productUrl(new URL(raw, base).toString()).toString();
  } catch {}
  return { title, price, image };
}

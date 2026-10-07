import { NextResponse } from "next/server";
import { returnPath } from "@/lib/return-path";
export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = process.env.AUTH_URL
    ? new URL(process.env.AUTH_URL).origin
    : url.origin;
  const raw = request.headers
    .get("cookie")
    ?.split(";")
    .map((v) => v.trim())
    .find(
      (v) =>
        v.startsWith("authjs.callback-url=") ||
        v.startsWith("__Secure-authjs.callback-url="),
    )
    ?.split("=")
    .slice(1)
    .join("=");
  let path = "";
  try {
    const callback = new URL(
      url.searchParams.get("callbackUrl") || decodeURIComponent(raw || ""),
      origin,
    );
    path = callback.pathname + callback.search;
  } catch {
    /* Use the default dashboard. */
  }
  const locale = path.startsWith("/en/") ? "en" : "fr";
  const error = url.searchParams.get("error");
  const destination = new URL(`/${locale}/login`, origin);
  destination.searchParams.set("next", returnPath(path, locale));
  if (error)
    destination.searchParams.set(
      "oauthError",
      error === "OAuthAccountNotLinked" || error === "AccountNotLinked"
        ? "link"
        : error === "AccessDenied"
          ? "denied"
          : "failed",
    );
  const response = NextResponse.redirect(destination);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

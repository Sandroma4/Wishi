import { test, expect } from "@playwright/test";
import fr from "../../messages/fr.json";
import en from "../../messages/en.json";
for (const [locale, t] of [
  ["fr", fr],
  ["en", en],
] as const) {
  test(`${locale}: Google entry points and localized OAuth errors preserve safe destinations`, async ({
    page,
  }) => {
    const next = `/${locale}/invite/${"a".repeat(64)}`;
    const providers = await (await page.request.get("/api/auth/providers")).json();
    expect(providers.google.callbackUrl).toBe("http://127.0.0.1:3107/api/auth/callback/google");
    await page.goto(`/${locale}/login?next=${encodeURIComponent(next)}`);
    await expect(
      page.getByRole("button", { name: t.googleAuth.continue }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.goto(`/${locale}/register?next=${encodeURIComponent(next)}`);
    await expect(
      page.getByRole("button", { name: t.googleAuth.continue }),
    ).toBeVisible();
    await page.context().addCookies([
      {
        name: "authjs.callback-url",
        value: encodeURIComponent(`http://127.0.0.1:3107${next}`),
        url: "http://127.0.0.1:3107",
      },
    ]);
    await page.goto("/api/auth/error?error=OAuthAccountNotLinked");
    await expect(page).toHaveURL(new RegExp(`/${locale}/login\\?`));
    await expect(page.getByRole("main").getByRole("alert")).toHaveText(
      t.googleAuth.linkRequired,
    );
    expect(new URL(page.url()).searchParams.get("next")).toBe(next);
    await page.goto("/api/auth/error?error=AccessDenied");
    await expect(page.getByRole("main").getByRole("alert")).toHaveText(
      t.googleAuth.denied,
    );
    await page.goto(
      "/api/auth/error?error=unknown&callbackUrl=https://evil.example/escape",
    );
    expect(new URL(page.url()).origin).toBe("http://127.0.0.1:3107");
    expect(new URL(page.url()).searchParams.get("next")).toBe("/fr/dashboard");
  });
}

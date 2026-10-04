"use client";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { signOut } from "next-auth/react";
import { changePassword } from "@/app/actions/auth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
export function ChangePasswordForm() {
  const t = useTranslations("accountSecurity"),
    a = useTranslations("auth"),
    errors = useTranslations("errors"),
    locale = useLocale();
  const [pending, setPending] = useState(false),
    [error, setError] = useState("");
  async function submit(form: FormData) {
    setPending(true);
    setError("");
    try {
      const result = await changePassword(form);
      if (result.error) setError(errors(result.error));
      else await signOut({ callbackUrl: `/${locale}/login?passwordChanged=1` });
    } catch {
      setError(errors("unexpected"));
    } finally {
      setPending(false);
    }
  }
  return (
    <form action={submit} className="stack">
      <h2>{t("title")}</h2>
      <p>{t("hint")}</p>
      <Input
        id="current-password"
        name="currentPassword"
        type="password"
        label={t("currentPassword")}
        autoComplete="current-password"
        maxLength={128}
        required
      />
      <Input
        id="change-new-password"
        name="password"
        type="password"
        label={t("newPassword")}
        autoComplete="new-password"
        minLength={12}
        maxLength={72}
        required
      />
      <p>{a("passwordHint")}</p>
      <Input
        id="change-confirmation"
        name="confirmation"
        type="password"
        label={t("confirmation")}
        autoComplete="new-password"
        minLength={12}
        maxLength={72}
        required
      />
      {error && <p role="alert">{error}</p>}
      <Button disabled={pending}>{t(pending ? "saving" : "save")}</Button>
    </form>
  );
}

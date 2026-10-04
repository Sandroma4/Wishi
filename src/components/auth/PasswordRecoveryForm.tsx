"use client";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import {
  requestPasswordReset,
  completePasswordReset,
} from "@/app/actions/password-reset";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
export function PasswordRecoveryForm({
  token,
  valid = true,
}: {
  token?: string;
  valid?: boolean;
}) {
  const t = useTranslations("recovery");
  const a = useTranslations("auth");
  const errors = useTranslations("errors");
  const locale = useLocale();
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  async function submit(form: FormData) {
    setPending(true);
    setError("");
    try {
      const result = token
        ? await completePasswordReset(token, form)
        : await requestPasswordReset(form, locale);
      if (result.error) setError(errors(result.error));
      else setSuccess(true);
    } catch {
      setError(errors("unexpected"));
    } finally {
      setPending(false);
    }
  }
  return (
    <main className="public-container">
      <Card>
        <CardContent>
          <div className="stack">
            <h1>{t(token ? "resetTitle" : "title")}</h1>
            {!valid ? (
              <>
                <p role="alert">{errors("invalidResetLink")}</p>
                <Link href="/forgot-password">{t("requestAgain")}</Link>
              </>
            ) : success ? (
              <p role="status">{t(token ? "resetSuccess" : "sent")}</p>
            ) : (
              <form action={submit} className="stack" aria-busy={pending}>
                {error && <p role="alert">{error}</p>}
                {token ? (
                  <>
                    <Input
                      id="new-password"
                      name="password"
                      type="password"
                      label={a("password")}
                      autoComplete="new-password"
                      minLength={12}
                      maxLength={72}
                      required
                      aria-describedby="recovery-password-hint"
                    />
                    <p id="recovery-password-hint">{a("passwordHint")}</p>
                    <Input
                      id="confirmation"
                      name="confirmation"
                      type="password"
                      label={t("confirmation")}
                      autoComplete="new-password"
                      minLength={12}
                      maxLength={72}
                      required
                    />
                  </>
                ) : (
                  <>
                    <p>{t("intro")}</p>
                    <Input
                      id="recovery-email"
                      name="email"
                      type="email"
                      label={a("email")}
                      autoComplete="email"
                      maxLength={254}
                      required
                    />
                  </>
                )}
                <Button disabled={pending}>
                  {t(pending ? "pending" : token ? "reset" : "send")}
                </Button>
              </form>
            )}
            <Link href="/login">{a("signIn")}</Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

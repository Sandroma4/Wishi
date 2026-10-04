"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { signIn } from "next-auth/react";
import { registerUser } from "@/app/actions/auth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/Card";
export function AuthForm({
  register = false,
  next,
  passwordChanged = false,
}: {
  register?: boolean;
  next: string;
  passwordChanged?: boolean;
}) {
  const t = useTranslations("auth");
  const recovery = useTranslations("recovery");
  const errors = useTranslations("errors");
  const locale = useLocale();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function submit(form: FormData) {
    setPending(true);
    setError("");
    try {
      if (register) {
        const result = await registerUser(form);
        if (result.error) setError(errors(result.error));
        else
          router.push("/" + locale + "/login?next=" + encodeURIComponent(next));
      } else {
        const result = await signIn("credentials", {
          email: form.get("email"),
          password: form.get("password"),
          redirect: false,
        });
        if (result?.error)
          setError(
            errors(
              result.code === "rateLimited"
                ? "rateLimited"
                : "invalidCredentials",
            ),
          );
        else {
          router.push(next);
          router.refresh();
        }
      }
    } catch {
      setError(errors("unexpected"));
    } finally {
      setPending(false);
    }
  }
  return (
    <main className="public-container">
      <Card>
        <CardHeader>
          <CardTitle>{t(register ? "signUpTitle" : "signInTitle")}</CardTitle>
          <CardDescription>
            {t(register ? "signUpDescription" : "signInDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {passwordChanged && <p role="status">{recovery("resetSuccess")}</p>}
          <form action={submit} className="stack">
            {error && <p role="alert">{error}</p>}
            {register && (
              <Input
                id="name"
                name="name"
                label={t("fullName")}
                autoComplete="name"
                maxLength={120}
                required
              />
            )}
            <Input
              id="email"
              name="email"
              type="email"
              label={t("email")}
              autoComplete="email"
              maxLength={254}
              required
            />
            <Input
              id="password"
              name="password"
              type="password"
              label={t("password")}
              autoComplete={register ? "new-password" : "current-password"}
              minLength={register ? 12 : 1}
              maxLength={register ? 72 : 128}
              required
            />
            {register && <p>{t("passwordHint")}</p>}
            <Button disabled={pending}>
              {t(
                pending
                  ? register
                    ? "signingUp"
                    : "signingIn"
                  : register
                    ? "signUp"
                    : "signIn",
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="stack">
          {!register && (
            <Link href="/forgot-password">{t("forgotPassword")}</Link>
          )}
          <p>
            {t(register ? "hasAccount" : "noAccount")}{" "}
            <Link
              href={{
                pathname: register ? "/login" : "/register",
                query: { next },
              }}
            >
              {t(register ? "signIn" : "signUp")}
            </Link>
          </p>
        </CardFooter>
      </Card>
    </main>
  );
}

"use client";
import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { updateProfile } from "@/app/actions/auth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
export function ProfileForm({
  name,
  email,
  locale,
}: {
  name: string;
  email: string;
  locale: string;
}) {
  const t = useTranslations("auth");
  const c = useTranslations("common");
  const errors = useTranslations("errors");
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  async function submit(form: FormData) {
    setPending(true);
    setMessage("");
    try {
      const result = await updateProfile(form);
      if (result.error) setMessage(errors(result.error));
      else {
        setMessage(t("profileSaved"));
        router.replace("/dashboard/profile", {
          locale: form.get("locale") === "en" ? "en" : "fr",
        });
        router.refresh();
      }
    } catch {
      setMessage(errors("unexpected"));
    } finally {
      setPending(false);
    }
  }
  return (
    <form action={submit} className="stack">
      <h1>{t("profile")}</h1>
      <Input
        id="profile-name"
        name="name"
        label={t("fullName")}
        defaultValue={name}
        maxLength={120}
        required
      />
      <Input id="profile-email" label={t("email")} value={email} readOnly />
      <label htmlFor="profile-locale">{t("preferredLanguage")}</label>
      <select id="profile-locale" name="locale" defaultValue={locale}>
        <option value="fr">Français</option>
        <option value="en">English</option>
      </select>
      <Button disabled={pending}>{c(pending ? "saving" : "save")}</Button>
      {message && <p role="status">{message}</p>}
    </form>
  );
}

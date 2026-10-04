"use client";
import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { createEvent } from "@/app/actions/event";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
export function CreateEventForm({
  families,
}: {
  families: { id: string; name: string }[];
}) {
  const t = useTranslations("events");
  const errors = useTranslations("errors");
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  if (!families.length) return null;
  async function submit(form: FormData) {
    setPending(true);
    setError("");
    try {
      const result = await createEvent(form);
      if (result.error) setError(errors(result.error));
      else {
        document.querySelector<HTMLFormElement>("#create-event-form")?.reset();
        router.refresh();
      }
    } catch {
      setError(errors("unexpected"));
    } finally {
      setPending(false);
    }
  }
  return (
    <Card>
      <CardContent>
        <form id="create-event-form" action={submit} className="stack">
          <h2>{t("createEvent")}</h2>
          {error && <p role="alert">{error}</p>}
          <Input
            id="event-name"
            name="name"
            label={t("name")}
            maxLength={120}
            required
          />
          <Input
            id="event-date"
            name="date"
            type="date"
            label={t("date")}
            required
          />
          <Input
            id="event-description"
            name="description"
            label={t("description")}
            maxLength={2000}
          />
          <label htmlFor="event-family">{t("family")}</label>
          <select id="event-family" name="familyId" required>
            {families.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
          <Button disabled={pending}>
            {t(pending ? "creating" : "create")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

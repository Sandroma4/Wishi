"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { updateEvent, deleteEvent } from "@/app/actions/event";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
export function EventEditor({
  event,
}: {
  event: { id: string; name: string; description: string | null; date: string };
}) {
  const t = useTranslations("events"),
    c = useTranslations("common"),
    errors = useTranslations("errors");
  const router = useRouter();
  const [pending, setPending] = useState(false),
    [message, setMessage] = useState("");
  async function submit(form: FormData) {
    setPending(true);
    setMessage("");
    try {
      const result = await updateEvent(event.id, form);
      if (result.error) setMessage(errors(result.error));
      else {
        setMessage(t("saved"));
        router.refresh();
      }
    } catch {
      setMessage(errors("unexpected"));
    } finally {
      setPending(false);
    }
  }
  async function remove() {
    if (!window.confirm(t("confirmDelete"))) return;
    setPending(true);
    setMessage("");
    try {
      const result = await deleteEvent(event.id);
      if (result.error) setMessage(errors(result.error));
      else {
        router.push("/dashboard/events");
        router.refresh();
      }
    } catch {
      setMessage(errors("unexpected"));
    } finally {
      setPending(false);
    }
  }
  return (
    <details>
      <summary>{t("manage")}</summary>
      <div className="stack">
        <form action={submit} className="stack">
          <Input
            id="edit-event-name"
            name="name"
            label={t("name")}
            defaultValue={event.name}
            maxLength={120}
            required
          />
          <Input
            id="edit-event-date"
            name="date"
            label={t("date")}
            type="date"
            defaultValue={event.date}
            required
          />
          <Input
            id="edit-event-description"
            name="description"
            label={t("description")}
            defaultValue={event.description || ""}
            maxLength={2000}
          />
          <Button disabled={pending}>{c(pending ? "saving" : "save")}</Button>
        </form>
        {message && <p role="status">{message}</p>}
        <Button variant="danger" disabled={pending} onClick={remove}>
          {t("delete")}
        </Button>
      </div>
    </details>
  );
}

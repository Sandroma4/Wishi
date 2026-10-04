"use client";
import { PreservedForm } from "@/components/ui/PreservedForm";
import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { createWishlist, updateWishlist } from "@/app/actions/wishlist";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
export function WishlistForm({
  events,
  initial,
  defaultEventId,
}: {
  events: { id: string; name: string }[];
  defaultEventId?: string;
  initial?: {
    id: string;
    name: string;
    description: string | null;
    visibility: string;
    eventId: string | null;
    occasion?: string | null;
    neededBy?: string | null;
    preferences?: string | null;
  };
}) {
  const t = useTranslations("wishlist");
  const flow = useTranslations("uiFlow");
  const help = useTranslations("usageHelp");
  const [visibility, setVisibility] = useState(initial?.visibility || "FAMILY");
  const [saved, setSaved] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);
  const fieldError = (name: string) =>
    fieldErrors.includes(name) ? flow("checkField") : undefined;
  const c = useTranslations("common");
  const errors = useTranslations("errors");
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function submit(form: FormData) {
    if (pending) return;
    setSaved(false);
    setFieldErrors([]);
    setPending(true);
    setError("");
    try {
      const result = initial
        ? await updateWishlist(initial.id, form)
        : await createWishlist(form);
      if (result.error) {
        setError(errors(result.error));
        setFieldErrors("fields" in result ? result.fields || [] : []);
      } else {
        setSaved(true);
        if ("wishlistId" in result)
          router.push("/dashboard/wishlists/" + result.wishlistId);
        router.refresh();
      }
    } catch {
      setError(errors("unexpected"));
    } finally {
      setPending(false);
    }
  }
  return (
    <PreservedForm
      action={submit}
      className="stack list-form"
      aria-busy={pending}
    >
      <h2>{t(initial ? "editTitle" : "createTitle")}</h2>
      {error && <p role="alert">{error}</p>}
      {saved && <p role="status">{flow("listSaved")}</p>}
      <Input
        id="list-name"
        name="name"
        error={fieldError("name")}
        label={t("name")}
        defaultValue={initial?.name}
        required
        maxLength={120}
      />
      <label htmlFor="visibility">{t("visibility")}</label>
      <select
        id="visibility"
        name="visibility"
        value={visibility}
        onChange={(event) => setVisibility(event.target.value)}
        aria-describedby="visibility-help"
      >
        {["PRIVATE", "FAMILY", "LINK", "PUBLIC"].map((value) => (
          <option key={value} value={value}>
            {t("visibility" + value[0] + value.slice(1).toLowerCase())}
          </option>
        ))}
      </select>
      <p id="visibility-help">{help(visibility.toLowerCase() + "Help")}</p>
      <details
        className="form-options"
        open={defaultEventId ? true : undefined}
      >
        <summary>{flow("moreOptions")}</summary>
        <div className="stack">
          <Input
            id="list-description"
            name="description"
            error={fieldError("description")}
            label={t("description")}
            defaultValue={initial?.description || ""}
            maxLength={2000}
          />
          <Input
            name="occasion"
            error={fieldError("occasion")}
            label={t("occasion")}
            defaultValue={initial?.occasion || ""}
            maxLength={120}
          />
          <Input
            name="neededBy"
            error={fieldError("neededBy")}
            label={t("neededBy")}
            type="date"
            defaultValue={initial?.neededBy || ""}
          />
          <label htmlFor="list-preferences">{t("preferences")}</label>
          <textarea
            id="list-preferences"
            name="preferences"
            defaultValue={initial?.preferences || ""}
            maxLength={2000}
            rows={3}
            aria-invalid={fieldErrors.includes("preferences")}
            aria-describedby="preferences-help"
          />
          <p id="preferences-help">
            {fieldError("preferences") || t("preferencesHint")}
          </p>
          <label htmlFor="list-event">{t("event")}</label>
          <select
            id="list-event"
            name="eventId"
            defaultValue={initial?.eventId || defaultEventId || ""}
          >
            <option value="">{t("noEvent")}</option>
            {events.map((event) => (
              <option value={event.id} key={event.id}>
                {event.name}
              </option>
            ))}
          </select>
        </div>
      </details>
      <div className="button-row form-actions">
        <Button type="submit" disabled={pending}>
          {pending ? c("saving") : c("save")}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          {c("cancel")}
        </Button>
      </div>
    </PreservedForm>
  );
}

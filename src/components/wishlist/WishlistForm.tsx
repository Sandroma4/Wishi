"use client";
import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { createWishlist, updateWishlist } from "@/app/actions/wishlist";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
export function WishlistForm({
  events,
  initial,
}: {
  events: { id: string; name: string }[];
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
  const c = useTranslations("common");
  const errors = useTranslations("errors");
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function submit(form: FormData) {
    setPending(true);
    setError("");
    try {
      const result = initial
        ? await updateWishlist(initial.id, form)
        : await createWishlist(form);
      if (result.error) setError(errors(result.error));
      else {
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
    <form action={submit} className="stack">
      <h2>{t(initial ? "editTitle" : "createTitle")}</h2>
      {error && <p role="alert">{error}</p>}
      <Input
        id="list-name"
        name="name"
        label={t("name")}
        defaultValue={initial?.name}
        required
        maxLength={120}
      />
      <Input
        id="list-description"
        name="description"
        label={t("description")}
        defaultValue={initial?.description || ""}
        maxLength={2000}
      />
      <Input
        name="occasion"
        label={t("occasion")}
        defaultValue={initial?.occasion || ""}
        maxLength={120}
      />
      <Input
        name="neededBy"
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
      />
      <p>{t("preferencesHint")}</p>
      <label htmlFor="visibility">{t("visibility")}</label>
      <select
        id="visibility"
        name="visibility"
        defaultValue={initial?.visibility || "FAMILY"}
      >
        {["PRIVATE", "FAMILY", "LINK", "PUBLIC"].map((value) => (
          <option key={value} value={value}>
            {t("visibility" + value[0] + value.slice(1).toLowerCase())}
          </option>
        ))}
      </select>
      <label htmlFor="list-event">{t("event")}</label>
      <select
        id="list-event"
        name="eventId"
        defaultValue={initial?.eventId || ""}
      >
        <option value="">{t("noEvent")}</option>
        {events.map((event) => (
          <option value={event.id} key={event.id}>
            {event.name}
          </option>
        ))}
      </select>
      <div className="button-row">
        <Button type="submit" disabled={pending}>
          {pending ? c("saving") : c("save")}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          {c("cancel")}
        </Button>
      </div>
    </form>
  );
}

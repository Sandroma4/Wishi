"use client";
import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import {
  createWishlistItem,
  updateWishlistItem,
  deleteWishlistItem,
} from "@/app/actions/item";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
type Gift = {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  priceCents: number | null;
  priority: string;
  image: string | null;
  size: string | null;
  color: string | null;
  model: string | null;
};
export function AddItemForm({
  wishlistId,
  item,
}: {
  wishlistId: string;
  item?: Gift;
}) {
  const t = useTranslations("wishlist");
  const trash = useTranslations("giftTrash");
  const c = useTranslations("common");
  const errors = useTranslations("errors");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function submit(form: FormData) {
    setPending(true);
    setError("");
    form.set("wishlistId", wishlistId);
    try {
      const result = item
        ? await updateWishlistItem(item.id, form)
        : await createWishlistItem(form);
      if (result.error) setError(errors(result.error));
      else {
        setOpen(false);
        router.refresh();
      }
    } catch {
      setError(errors("unexpected"));
    } finally {
      setPending(false);
    }
  }
  async function remove() {
    if (!item || !window.confirm(trash("confirm"))) return;
    setPending(true);
    setError("");
    try {
      const result = await deleteWishlistItem(item.id);
      if (result.error) setError(errors(result.error));
      else router.refresh();
    } catch {
      setError(errors("unexpected"));
    } finally {
      setPending(false);
    }
  }
  if (!open)
    return (
      <div className="stack">
        <div className="button-row">
          <Button disabled={pending} onClick={() => setOpen(true)}>
            {item ? c("edit") : t("addItem")}
          </Button>
          {item && (
            <Button disabled={pending} variant="danger" onClick={remove}>
              {trash("move")}
            </Button>
          )}
        </div>
        {error && <p role="alert">{error}</p>}
      </div>
    );
  const prefix = item?.id || "new";
  return (
    <Card>
      <CardContent>
        <form action={submit} className="stack">
          <h3>{t(item ? "editGift" : "addItem")}</h3>
          {error && <p role="alert">{error}</p>}
          <Input
            id={prefix + "-title"}
            name="title"
            label={t("giftName")}
            defaultValue={item?.title}
            maxLength={120}
            required
          />
          <Input
            id={prefix + "-description"}
            name="description"
            label={t("descriptionGift")}
            defaultValue={item?.description || ""}
            maxLength={2000}
          />
          <Input
            id={prefix + "-url"}
            name="url"
            type="url"
            label={t("link")}
            defaultValue={item?.url || ""}
          />
          <Input
            id={prefix + "-price"}
            name="price"
            type="number"
            min="0"
            max="9999999.99"
            step="0.01"
            label={t("price")}
            defaultValue={
              item?.priceCents == null ? "" : (item.priceCents / 100).toFixed(2)
            }
          />
          {(["size", "color", "model"] as const).map((key) => (
            <Input
              key={key}
              id={prefix + "-" + key}
              name={key}
              label={t(key)}
              maxLength={80}
              defaultValue={item?.[key] || ""}
            />
          ))}
          <Input
            id={prefix + "-photo"}
            type="file"
            name="photo"
            accept="image/jpeg,image/png,image/webp"
            label={t("photo")}
            aria-describedby={prefix + "-photo-hint"}
          />
          <p id={prefix + "-photo-hint"}>{t("photoHint")}</p>
          {item?.image && (
            <label>
              <input type="checkbox" name="removePhoto" /> {t("removePhoto")}
            </label>
          )}
          <label htmlFor={prefix + "-priority"}>{t("priority")}</label>
          <select
            name="priority"
            id={prefix + "-priority"}
            defaultValue={item?.priority || "NORMAL"}
          >
            {["LOW", "NORMAL", "HIGH", "ESSENTIAL"].map((value) => (
              <option key={value} value={value}>
                {t("priority" + value[0] + value.slice(1).toLowerCase())}
              </option>
            ))}
          </select>
          <div className="button-row">
            <Button disabled={pending}>
              {pending ? c("saving") : c("save")}
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={pending}
              onClick={() => setOpen(false)}
            >
              {c("cancel")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

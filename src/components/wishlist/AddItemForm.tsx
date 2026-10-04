"use client";
import { PreservedForm } from "@/components/ui/PreservedForm";
import { useRef, useState } from "react";
import { previewProduct } from "@/app/actions/product-preview";
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
  isGroupGift?: boolean;
};
export function AddItemForm({
  wishlistId,
  item,
}: {
  wishlistId: string;
  item?: Gift;
}) {
  const t = useTranslations("wishlist");
  const flow = useTranslations("uiFlow");
  const [mode, setMode] = useState<"link" | "manual" | null>(
    item ? "manual" : null,
  );
  const [preview, setPreview] = useState<Record<string, string> | null>(null);
  const [lastMode, setLastMode] = useState<"link" | "manual">("manual");
  const [success, setSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);
  const fieldError = (name: string) =>
    fieldErrors.includes(name) ? flow("checkField") : undefined;
  const trash = useTranslations("giftTrash");
  const c = useTranslations("common");
  const errors = useTranslations("errors");
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const importText = useTranslations("productImport");
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState("");
  const [importedPhoto, setImportedPhoto] = useState("");
  async function importLink() {
    const form = formRef.current;
    if (!form) return;
    const url = (form.elements.namedItem("url") as HTMLInputElement).value;
    setPreview(null);
    setImporting(true);
    setImportMessage("");
    try {
      const result = await previewProduct(wishlistId, url);
      if ((form.elements.namedItem("url") as HTMLInputElement).value !== url)
        return;
      if ("error" in result) {
        setImportMessage(importText("failed"));
        return;
      }
      for (const key of ["title", "price"] as const) {
        const input = form.elements.namedItem(key) as HTMLInputElement;
        if (!input.value && result[key]) input.value = result[key];
      }
      if (!item?.image && result.photo) setImportedPhoto(result.photo);
      setImportMessage(
        importText(
          result.title || result.price || result.photo ? "review" : "failed",
        ),
      );
    } catch {
      setImportMessage(importText("failed"));
    } finally {
      setImporting(false);
    }
  }
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function submit(form: FormData) {
    if (pending || importing) return;
    if (!preview) {
      const group = item?.isGroupGift || form.get("isGroupGift") === "on";
      if (group && !(Number(form.get("price")) > 0)) {
        setFieldErrors(["price"]);
        setError(errors("groupPriceRequired"));
        return;
      }
      setPreview(
        Object.fromEntries(
          [...form.entries()].filter(
            (entry): entry is [string, string] => typeof entry[1] === "string",
          ),
        ),
      );
      return;
    }
    setPending(true);
    setError("");
    setFieldErrors([]);
    form.set("wishlistId", wishlistId);
    const photo = form.get("photo");
    if (importedPhoto && !(photo instanceof File && photo.size)) {
      const bytes = Uint8Array.from(atob(importedPhoto), (letter) =>
        letter.charCodeAt(0),
      );
      form.set(
        "photo",
        new File([bytes], "product.webp", { type: "image/webp" }),
      );
    }
    try {
      const result = item
        ? await updateWishlistItem(item.id, form)
        : await createWishlistItem(form);
      if (result.error) {
        setError(errors(result.error));
        setFieldErrors(
          "fields" in result
            ? result.fields || []
            : result.error === "groupPriceRequired"
              ? ["price"]
              : result.error === "duplicateGift"
                ? ["url"]
                : [],
        );
      } else {
        setLastMode(mode || "manual");
        setSuccess(flow("giftSaved"));
        setPreview(null);
        setMode(item ? "manual" : null);
        setOpen(false);
        setImportedPhoto("");
        setImportMessage("");
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
          <Button
            disabled={pending}
            onClick={() => {
              setSuccess("");
              if (!item && success) setMode(lastMode);
              setOpen(true);
            }}
          >
            {item ? c("edit") : success ? flow("addAnother") : t("addItem")}
          </Button>
          {item && (
            <Button disabled={pending} variant="danger" onClick={remove}>
              {trash("move")}
            </Button>
          )}
        </div>
        {error && <p role="alert">{error}</p>}
        {success && <p role="status">{success}</p>}
      </div>
    );
  if (!mode)
    return (
      <Card>
        <CardContent>
          <h3>{t("addItem")}</h3>
          <p>{flow("chooseMode")}</p>
          <div className="button-row form-actions">
            <Button onClick={() => setMode("link")}>{flow("fromLink")}</Button>
            <Button variant="secondary" onClick={() => setMode("manual")}>
              {flow("manual")}
            </Button>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              {c("cancel")}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  const prefix = item?.id || "new";
  return (
    <Card>
      <CardContent>
        <PreservedForm
          ref={formRef}
          action={submit}
          className="stack gift-form"
          onInput={() => {
            setPreview(null);
            setFieldErrors([]);
          }}
          aria-busy={pending || importing}
        >
          <h3>{t(item ? "editGift" : "addItem")}</h3>
          {error && <p role="alert">{error}</p>}
          {error === errors("duplicateGift") && (
            <label>
              <input type="checkbox" name="allowDuplicate" />{" "}
              {t("allowDuplicate")}
            </label>
          )}
          <details
            className="form-options"
            open={mode === "link" ? true : undefined}
          >
            <summary>{flow("fromLink")}</summary>
            <div className="stack">
              <Input
                id={prefix + "-url"}
                name="url"
                error={fieldError("url")}
                type="url"
                label={t("link")}
                defaultValue={item?.url || ""}
                maxLength={2048}
              />
              <Button
                type="button"
                variant="secondary"
                disabled={pending || importing}
                onClick={importLink}
              >
                {importText(importing ? "loading" : "button")}
              </Button>
              <p>{importText("help")}</p>
              <p role="status">{importMessage}</p>
            </div>
          </details>
          <Input
            id={prefix + "-title"}
            name="title"
            error={fieldError("title")}
            label={t("giftName")}
            defaultValue={item?.title}
            maxLength={120}
            required
          />
          <Input
            id={prefix + "-price"}
            name="price"
            error={fieldError("price")}
            type="number"
            min="0"
            max="9999999.99"
            step="0.01"
            label={t("price")}
            defaultValue={
              item?.priceCents == null ? "" : (item.priceCents / 100).toFixed(2)
            }
          />
          <details className="form-options">
            <summary>{flow("moreOptions")}</summary>
            <div className="stack">
              <Input
                id={prefix + "-description"}
                name="description"
                error={fieldError("description")}
                label={t("descriptionGift")}
                defaultValue={item?.description || ""}
                maxLength={2000}
              />
              {!item ? (
                <label>
                  <input type="checkbox" name="isGroupGift" /> {t("groupGift")}
                </label>
              ) : (
                item.isGroupGift && <p>{t("groupGift")}</p>
              )}
              {!item && <p>{t("groupHint")}</p>}
              {(["size", "color", "model"] as const).map((key) => (
                <Input
                  key={key}
                  id={prefix + "-" + key}
                  name={key}
                  error={fieldError(key)}
                  label={t(key)}
                  maxLength={80}
                  defaultValue={item?.[key] || ""}
                />
              ))}
            </div>
          </details>
          <Input
            id={prefix + "-photo"}
            type="file"
            name="photo"
            error={fieldError("photo")}
            accept="image/jpeg,image/png,image/webp"
            label={t("photo")}
            aria-describedby={prefix + "-photo-hint"}
          />
          <p id={prefix + "-photo-hint"}>{t("photoHint")}</p>
          {importedPhoto && (
            <div className="stack">
              {/* Local preview never contacts the merchant from the browser. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={"data:image/webp;base64," + importedPhoto}
                width={160}
                height={160}
                style={{ objectFit: "contain" }}
                alt={importText("photoAlt")}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setImportedPhoto("");
                  setPreview(null);
                }}
              >
                {importText("remove")}
              </Button>
            </div>
          )}
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
          {preview && (
            <section
              className="gift-preview stack"
              aria-label={flow("preview")}
              role="status"
            >
              <h4>{flow("preview")}</h4>
              <strong>{preview.title}</strong>
              {preview.description && <p>{preview.description}</p>}
              {preview.price && (
                <p>
                  {t("price")}: {preview.price} €
                </p>
              )}
              {preview.url && <p>{preview.url}</p>}
              <p>
                {t("priority")}:{" "}
                {t(
                  "priority" +
                    preview.priority[0] +
                    preview.priority.slice(1).toLowerCase(),
                )}
              </p>
              {["size", "color", "model"].map((key) =>
                preview[key] ? (
                  <p key={key}>
                    {t(key)}: {preview[key]}
                  </p>
                ) : null,
              )}
              {(item?.isGroupGift || preview.isGroupGift === "on") && (
                <p>{t("groupGift")}</p>
              )}
              <p>{flow("previewHelp")}</p>
            </section>
          )}
          <div className="button-row form-actions">
            <Button disabled={pending || importing}>
              {pending ? c("saving") : preview ? c("save") : flow("reviewGift")}
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={pending || importing}
              onClick={() => {
                setOpen(false);
                setPreview(null);
                setMode(item ? "manual" : null);
              }}
            >
              {c("cancel")}
            </Button>
          </div>
        </PreservedForm>
      </CardContent>
    </Card>
  );
}

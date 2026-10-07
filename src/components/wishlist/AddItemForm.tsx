"use client";
import { PreservedForm } from "@/components/ui/PreservedForm";
import { useEffect, useRef, useState } from "react";
import { previewProduct } from "@/app/actions/product-preview";
import { useRouter } from "@/i18n/routing";
import { useTranslations, useLocale } from "next-intl";
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
  alternativeUrls?: string;
};
export function AddItemForm({
  wishlistId,
  item,
  initialUrl = "",
  initialTitle = "",
}: {
  wishlistId: string;
  item?: Gift;
  initialUrl?: string;
  initialTitle?: string;
}) {
  const t = useTranslations("wishlist");
  const locale = useLocale();
  const flow = useTranslations("uiFlow");
  const [mode, setMode] = useState<"link" | "manual" | null>(
    item ? "manual" : initialUrl ? "link" : initialTitle ? "manual" : null,
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
  const chooserRef = useRef<HTMLDivElement>(null);
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
      setDirty(true);
      for (const key of ["title", "price"] as const) {
        const input = form.elements.namedItem(key) as HTMLInputElement;
        if (!input.value && result[key]) input.value = result[key];
      }
      if (!item?.image && result.photo) setImportedPhoto(result.photo);
      form.dispatchEvent(new Event("input", { bubbles: true }));
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
  const [open, setOpen] = useState(Boolean(initialUrl || initialTitle));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [localPhoto, setLocalPhoto] = useState("");
  const [dirty, setDirty] = useState(false);
  const photoRead = useRef(0);
  useEffect(() => {
    if (open && !mode) {
      chooserRef.current?.scrollIntoView({ block: "start" });
      chooserRef.current
        ?.querySelector<HTMLButtonElement>("button")
        ?.focus({ preventScroll: true });
    }
    if (open && mode) {
      formRef.current?.scrollIntoView({ block: "start" });
      formRef.current
        ?.querySelector<HTMLInputElement>(
          mode === "manual" ? 'input[name="title"]' : 'input[name="url"]',
        )
        ?.focus({ preventScroll: true });
    }
  }, [open, mode]);
  useEffect(() => {
    if (preview)
      formRef.current
        ?.querySelector(".gift-preview")
        ?.scrollIntoView({ block: "nearest" });
  }, [preview]);
  function cancel() {
    if (dirty && !window.confirm(flow("discardDraft"))) return;
    formRef.current?.dispatchEvent(new Event("draft-clear"));
    setOpen(false);
    setPreview(null);
    setMode(item ? "manual" : null);
    setDirty(false);
    setLocalPhoto("");
    setImportedPhoto("");
    setError("");
    photoRead.current++;
  }
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
        formRef.current?.dispatchEvent(new Event("draft-clear"));
        setLastMode(mode || "manual");
        setSuccess(flow("giftSaved"));
        setDirty(false);
        setLocalPhoto("");
        photoRead.current++;
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
            <Button
              disabled={pending}
              variant="ghost"
              className="gift-remove"
              onClick={remove}
            >
              {trash("move")}
            </Button>
          )}
        </div>
        {error && <p role="alert">{error}</p>}
        {success && (
          <>
            <p role="status">{success}</p>
            <a className="secondary-link" href="#list-gifts">
              {flow("viewMyList")}
            </a>
          </>
        )}
      </div>
    );
  if (!mode)
    return (
      <Card className="gift-editor">
        <CardContent>
          <div ref={chooserRef} className="gift-choice-panel">
            <h2>{t("addItem")}</h2>
            <p>{flow("chooseMode")}</p>
            <div className="gift-mode-choices">
              <button
                type="button"
                className="gift-mode-choice"
                onClick={() => setMode("link")}
              >
                <svg
                  aria-hidden="true"
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                >
                  <path d="m10 13 4-4m-6 7-1 1a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0m2 1 1-1a4 4 0 0 1 6 6l-4 4a4 4 0 0 1-6 0" />
                </svg>
                <strong>{flow("fromLink")}</strong>
                <span>{flow("linkModeHelp")}</span>
              </button>
              <button
                type="button"
                className="gift-mode-choice"
                onClick={() => setMode("manual")}
              >
                <svg
                  aria-hidden="true"
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m15 4 5 5-11 11-6 1 1-6L15 4Zm-2 2 5 5" />
                </svg>
                <strong>{flow("manual")}</strong>
                <span>{flow("manualModeHelp")}</span>
              </button>
            </div>
            <Button variant="ghost" onClick={cancel}>
              {c("cancel")}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  const prefix = item?.id || "new";
  return (
    <Card className="gift-editor">
      <CardContent>
        <PreservedForm
          draftKey={`gift:${wishlistId}:${item?.id || "new"}`}
          onDraftRestore={(values) => {
            setDirty(true);
            if (values.url) setMode("link");
          }}
          ref={formRef}
          action={submit}
          className="stack gift-form"
          onInput={() => {
            setPreview(null);
            setFieldErrors([]);
            setDirty(true);
          }}
          onInvalid={(event) => {
            if ((event.target as HTMLInputElement).name === "url")
              setMode("link");
          }}
          aria-busy={pending || importing}
        >
          <h2>{t(item ? "editGift" : "addItem")}</h2>
          <p className="form-hint">{flow("optionalHelp")}</p>
          <p className="form-hint">{flow("draftHelp")}</p>
          <div
            className="button-row"
            role="group"
            aria-label={flow("chooseMode")}
          >
            <Button
              type="button"
              variant={mode === "link" ? "primary" : "secondary"}
              onClick={() => setMode("link")}
            >
              {flow("fromLink")}
            </Button>
            <Button
              type="button"
              variant={mode === "manual" ? "primary" : "secondary"}
              onClick={() => setMode("manual")}
            >
              {flow("manual")}
            </Button>
          </div>
          {error && <p role="alert">{error}</p>}
          {error === errors("duplicateGift") && (
            <label>
              <input type="checkbox" name="allowDuplicate" />{" "}
              {t("allowDuplicate")}
            </label>
          )}
          <div hidden={mode !== "link"}>
            <div className="stack">
              <Input
                id={prefix + "-url"}
                name="url"
                error={fieldError("url")}
                type="url"
                label={t("link")}
                defaultValue={item?.url || initialUrl}
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
          </div>
          <Input
            id={prefix + "-title"}
            name="title"
            error={fieldError("title")}
            label={flow("requiredName")}
            defaultValue={item?.title || initialTitle}
            maxLength={120}
            required
          />
          <div className="gift-main-fields">
            <Input
              id={prefix + "-price"}
              name="price"
              error={fieldError("price")}
              type="number"
              min="0"
              max="9999999.99"
              step="0.01"
              label={flow("estimatedPrice")}
              placeholder="29.90"
              defaultValue={
                item?.priceCents == null
                  ? ""
                  : (item.priceCents / 100).toFixed(2)
              }
            />
            <div className="gift-priority">
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
              <p className="form-hint">{flow("priorityHelp")}</p>
            </div>
          </div>
          <details className="form-options list-detail-options">
            <summary>{flow("optionalDetails")}</summary>
            <div className="stack">
              <label htmlFor={prefix + "-alternatives"}>
                {t("alternativeUrls")}
              </label>
              <textarea
                id={prefix + "-alternatives"}
                name="alternativeUrls"
                rows={3}
                maxLength={10240}
                defaultValue={item?.alternativeUrls || ""}
                  aria-invalid={fieldErrors.includes("alternativeUrls")}
                aria-describedby={prefix + "-alternatives-help"}
              />
                <p id={prefix + "-alternatives-help"}>{fieldError("alternativeUrls") || t("alternativeHelp")}</p>
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
            label={flow("addPhoto")}
            onChange={(event) => {
              const file = event.target.files?.[0];
              const generation = ++photoRead.current;
              setLocalPhoto("");
              setDirty(true);
              setPreview(null);
              if (!file) return;
              if (
                file.size > 5 * 1024 * 1024 ||
                !["image/jpeg", "image/png", "image/webp"].includes(file.type)
              ) {
                setFieldErrors(["photo"]);
                return;
              }
              const reader = new FileReader();
              reader.onload = () => {
                if (generation === photoRead.current)
                  setLocalPhoto(String(reader.result));
              };
              reader.readAsDataURL(file);
            }}
            aria-describedby={prefix + "-photo-hint"}
          />
          <p className="form-hint" id={prefix + "-photo-hint"}>
            {t("photoHint")}
          </p>
          {(localPhoto || importedPhoto) && (
            <div className="stack">
              {/* Local preview never contacts the merchant from the browser. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={localPhoto || "data:image/webp;base64," + importedPhoto}
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
                  setLocalPhoto("");
                  photoRead.current++;
                  const input = formRef.current?.elements.namedItem(
                    "photo",
                  ) as HTMLInputElement | null;
                  if (input) input.value = "";
                  setDirty(true);
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
                  {t("price")}:{" "}
                  {new Intl.NumberFormat(locale, {
                    style: "currency",
                    currency: "EUR",
                  }).format(Number(preview.price))}
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
              {pending
                ? c("saving")
                : preview
                  ? item
                    ? c("save")
                    : flow("addToList")
                  : flow("reviewGift")}
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={pending || importing}
              onClick={cancel}
            >
              {c("cancel")}
            </Button>
          </div>
        </PreservedForm>
      </CardContent>
    </Card>
  );
}

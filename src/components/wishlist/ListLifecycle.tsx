"use client";
import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { duplicateWishlist, setWishlistState } from "@/app/actions/wishlist";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
export function ListLifecycle({
  id,
  name,
  state = "active",
}: {
  id: string;
  name: string;
  state?: "active" | "archived" | "trash";
}) {
  const t = useTranslations("listLifecycle"),
    errors = useTranslations("errors"),
    router = useRouter();
  const inputId = useId();
  const [pending, setPending] = useState(false),
    [message, setMessage] = useState(""),
    [copy, setCopy] = useState(false);
  async function act(operation: "archive" | "trash" | "restore") {
    if (operation === "trash" && !window.confirm(t("confirmTrash"))) return;
    setPending(true);
    setMessage("");
    try {
      const result = await setWishlistState(id, operation);
      if (result.error) setMessage(errors(result.error));
      else {
        router.push(
          "/dashboard/wishlists" +
            (operation === "trash"
              ? "?view=trash"
              : operation === "archive"
                ? "?view=archived"
                : ""),
        );
        router.refresh();
      }
    } catch {
      setMessage(errors("unexpected"));
    } finally {
      setPending(false);
    }
  }
  return (
    <div className="stack">
      <div className="button-row">
        {state === "active" ? (
          <Button
            variant="secondary"
            disabled={pending}
            onClick={() => act("archive")}
          >
            {t("archive")}
          </Button>
        ) : (
          <Button
            variant="secondary"
            disabled={pending}
            onClick={() => act("restore")}
          >
            {t("restore")}
          </Button>
        )}
        {state !== "trash" && (
          <>
            <Button
              variant="secondary"
              disabled={pending}
              onClick={() => setCopy(!copy)}
            >
              {t("duplicate")}
            </Button>
            <Button
              variant="danger"
              disabled={pending}
              onClick={() => act("trash")}
            >
              {t("trash")}
            </Button>
          </>
        )}
      </div>
      {copy && (
        <form
          className="stack"
          action={async (form) => {
            setPending(true);
            setMessage("");
            try {
              const result = await duplicateWishlist(
                id,
                String(form.get("name") || ""),
              );
              if (result.error) setMessage(errors(result.error));
              else if (result.wishlistId) {
                router.push(`/dashboard/wishlists/${result.wishlistId}`);
                router.refresh();
              }
            } catch {
              setMessage(errors("unexpected"));
            } finally {
              setPending(false);
            }
          }}
        >
          <Input
            id={inputId}
            label={t("copyName")}
            name="name"
            required
            maxLength={120}
            defaultValue={t("copyDefault", { name: name.slice(0, 100) })}
          />
          <p>{t("copyHelp")}</p>
          <Button disabled={pending}>{t("createCopy")}</Button>
        </form>
      )}
      {message && <p role="status">{message}</p>}
    </div>
  );
}

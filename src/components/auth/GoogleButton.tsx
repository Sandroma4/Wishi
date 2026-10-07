"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
export function GoogleButton({
  next,
  link = false,
  disabled = false,
}: {
  next: string;
  link?: boolean;
  disabled?: boolean;
}) {
  const t = useTranslations("googleAuth");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  return (
    <div className="stack google-signin">
      <Button
        type="button"
        variant="secondary"
        disabled={disabled || pending}
        onClick={async () => {
          setPending(true);
          setError(false);
          try {
            await signIn("google", { redirectTo: next });
          } catch {
            setError(true);
            setPending(false);
          }
        }}
      >
        {t(pending ? "redirecting" : link ? "link" : "continue")}
      </Button>
      {error && <p role="alert">{t("error")}</p>}
    </div>
  );
}

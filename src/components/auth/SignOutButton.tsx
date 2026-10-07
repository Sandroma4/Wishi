"use client";
import { signOut } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { clearDrafts } from "@/components/ui/DraftScope";
export function SignOutButton() {
  const t = useTranslations("dashboard");
  const locale = useLocale();
  return (
    <Button
      variant="ghost"
      onClick={() => {
        clearDrafts();
        return signOut({ callbackUrl: "/" + locale + "/login" });
      }}
    >
      {t("signOut")}
    </Button>
  );
}

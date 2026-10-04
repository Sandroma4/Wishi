"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { createInvitation } from "@/app/actions/family";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
export function InviteMemberForm({ familyId }: { familyId: string }) {
  const t = useTranslations("family"),
    errors = useTranslations("errors"),
    router = useRouter();
  const [pending, setPending] = useState(false),
    [message, setMessage] = useState("");
  async function submit(form: FormData) {
    setPending(true);
    setMessage("");
    try {
      const result = await createInvitation(
        familyId,
        String(form.get("email") || ""),
      );
      if (result.error) setMessage(errors(result.error));
      else {
        setMessage(t("invitationSaved"));
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
      <h3>{t("invite")}</h3>
      <p>{t("invitationReplacement")}</p>
      <form action={submit} className="stack">
        <Input
          id={"invite-" + familyId}
          name="email"
          type="email"
          label={t("inviteEmail")}
          maxLength={254}
          required
        />
        <Button disabled={pending}>
          {t(pending ? "generating" : "generate")}
        </Button>
      </form>
      {message && <p role="status">{message}</p>}
    </div>
  );
}

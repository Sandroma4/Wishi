"use client";
import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { acceptInvitation } from "@/app/actions/family";
import { Button } from "@/components/ui/Button";
export function AcceptInvitation({ token }: { token: string }) {
  const t = useTranslations("family");
  const errors = useTranslations("errors");
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function join() {
    setPending(true);
    try {
      const result = await acceptInvitation(token);
      if (result.error) setError(errors(result.error));
      else {
        router.push("/dashboard/family");
        router.refresh();
      }
    } catch {
      setError(errors("unexpected"));
    } finally {
      setPending(false);
    }
  }
  return (
    <div className="stack">
      <Button disabled={pending} onClick={join}>
        {t(pending ? "joining" : "join")}
      </Button>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}

"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { changeFamilyMembership } from "@/app/actions/family";
import { Button } from "@/components/ui/Button";
export function MemberManagement({
  familyId,
  ownerId,
  userId,
  members,
}: {
  familyId: string;
  ownerId: string;
  userId: string;
  members: { userId: string; role: string; user: { name: string | null } }[];
}) {
  const t = useTranslations("familyManagement"),
    errors = useTranslations("errors"),
    router = useRouter();
  const [pending, setPending] = useState(false),
    [message, setMessage] = useState("");
  const admin = members.some((m) => m.userId === userId && m.role === "ADMIN");
  async function act(operation: string, memberId?: string, name?: string) {
    if (
      !window.confirm(
        t("confirm" + operation[0].toUpperCase() + operation.slice(1), {
          name: name || t("unknown"),
        }),
      )
    )
      return;
    setPending(true);
    setMessage("");
    try {
      const result = await changeFamilyMembership(
        familyId,
        operation,
        memberId,
      );
      if (result.error) setMessage(errors(result.error));
      else {
        setMessage(t("saved"));
        router.refresh();
      }
    } catch {
      setMessage(errors("unexpected"));
    } finally {
      setPending(false);
    }
  }
  return (
    <section className="stack">
      <h3>{t("title")}</h3>
      {admin &&
        members
          .filter((m) => m.userId !== userId)
          .map((member) => (
            <div key={member.userId} className="stack">
              <p>
                {member.user.name || t("unknown")}
                {member.userId === ownerId ? ` · ${t("owner")}` : ""}
              </p>
              <div className="button-row">
                {member.role !== "ADMIN" && (
                  <Button
                    variant="secondary"
                    disabled={pending}
                    onClick={() =>
                      act(
                        "promote",
                        member.userId,
                        member.user.name || undefined,
                      )
                    }
                  >
                    {t("promote")}
                  </Button>
                )}
                {userId === ownerId && (
                  <Button
                    variant="secondary"
                    disabled={pending}
                    onClick={() =>
                      act(
                        "transfer",
                        member.userId,
                        member.user.name || undefined,
                      )
                    }
                  >
                    {t("transfer")}
                  </Button>
                )}
                {member.userId !== ownerId && (
                  <Button
                    variant="danger"
                    disabled={pending}
                    onClick={() =>
                      act(
                        "remove",
                        member.userId,
                        member.user.name || undefined,
                      )
                    }
                  >
                    {t("remove")}
                  </Button>
                )}
              </div>
            </div>
          ))}
      {userId === ownerId ? (
        <p>{t("ownerMustTransfer")}</p>
      ) : (
        <Button
          variant="secondary"
          disabled={pending}
          onClick={() => act("leave")}
        >
          {t("leave")}
        </Button>
      )}
      {message && <p role="status">{message}</p>}
    </section>
  );
}

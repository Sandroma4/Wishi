"use client";
import { PreservedForm } from "@/components/ui/PreservedForm";
import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { sendFeedback } from "@/app/actions/feedback";
import { Button } from "@/components/ui/Button";
export function FeedbackForm() {
  const t = useTranslations("feedback"),
    errors = useTranslations("errors"),
    ref = useRef<HTMLFormElement>(null);
  const [pending, setPending] = useState(false),
    [message, setMessage] = useState("");
  return (
    <PreservedForm
      ref={ref}
      className="stack"
      aria-busy={pending}
      action={async (form) => {
        setPending(true);
        setMessage("");
        try {
          const result = await sendFeedback(form);
          if ("error" in result && result.error)
            setMessage(errors(result.error));
          else {
            setMessage(t("saved"));
            ref.current?.reset();
          }
        } catch {
          setMessage(errors("unexpected"));
        } finally {
          setPending(false);
        }
      }}
    >
      <label htmlFor="feedback-category">{t("category")}</label>
      <select name="category" id="feedback-category">
        {["BUG", "IDEA", "OTHER"].map((key) => (
          <option key={key} value={key}>
            {t(key)}
          </option>
        ))}
      </select>
      <label htmlFor="feedback-message">{t("message")}</label>
      <textarea
        id="feedback-message"
        name="message"
        minLength={10}
        maxLength={2000}
        rows={5}
        required
        aria-describedby="feedback-help"
      />
      <p id="feedback-help">{t("help")}</p>
      <Button disabled={pending}>{t(pending ? "sending" : "send")}</Button>
      <p role="status">{message}</p>
    </PreservedForm>
  );
}

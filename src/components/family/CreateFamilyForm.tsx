"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { createFamily } from "@/app/actions/family";
import { useState } from "react";
import { useTranslations } from "next-intl";

export function CreateFamilyForm({
  showTitle = true,
}: {
  showTitle?: boolean;
}) {
  const t = useTranslations("family");
  const errors = useTranslations("errors");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = e.currentTarget;
    try {
      const result = await createFamily(new FormData(form));
      if (result.error) setError(errors(result.error));
      else form.reset();
    } catch {
      setError(errors("unexpected"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      {showTitle && (
        <CardHeader>
          <CardTitle>{t("createFamily")}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <form
          id="create-family-form"
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
        >
          {error && (
            <div role="alert" style={{ color: "red", fontSize: "0.875rem" }}>
              {error}
            </div>
          )}
          <Input
            id="name"
            name="name"
            label={t("familyName")}
            placeholder={t("familyNamePlaceholder")}
            required
            maxLength={120}
          />
          <Input id="description" name="description" label={t("description")} />
          <Button
            type="submit"
            disabled={loading}
            style={{ marginTop: "0.5rem" }}
          >
            {loading ? t("creating") : t("create")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

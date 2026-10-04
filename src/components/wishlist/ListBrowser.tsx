"use client";
import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/Input";
export function ListBrowser({
  lists,
}: {
  lists: {
    id: string;
    name: string;
    description: string | null;
    card: ReactNode;
  }[];
}) {
  const t = useTranslations("listNavigation");
  const [query, setQuery] = useState("");
  const normalize = (text: string) =>
    text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  const visible = lists.filter((list) =>
    normalize(list.name + " " + (list.description || "")).includes(
      normalize(query.trim()),
    ),
  );
  return (
    <div className="stack">
      <Input
        type="search"
        label={t("search")}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        maxLength={120}
      />
      <p role="status">
        {t("shown", { count: visible.length, total: lists.length })}
      </p>
      <div className="wishlist-browser-grid">
        {visible.map((list) => (
          <div key={list.id}>{list.card}</div>
        ))}
      </div>
      {!visible.length && <p>{t("noResults")}</p>}
    </div>
  );
}

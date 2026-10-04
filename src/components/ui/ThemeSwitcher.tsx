"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
export function ThemeSwitcher({ initial = "system" }: { initial?: string }) {
  const t = useTranslations("theme");
  const [theme, setTheme] = useState(initial);
  return (
    <label className="theme-switcher">
      <span>{t("label")}</span>
      <select
        value={theme}
        onChange={(event) => {
          const value = event.target.value;
          document.documentElement.dataset.theme = value;
          document.cookie = `wishi-theme=${value}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
          setTheme(value);
        }}
      >
        <option value="light">{t("light")}</option>
        <option value="dark">{t("dark")}</option>
        <option value="system">{t("system")}</option>
      </select>
    </label>
  );
}

"use client";
import { createContext, useContext, type ReactNode } from "react";
const Scope = createContext("");
export function DraftScope({
  userId,
  children,
}: {
  userId: string;
  children: ReactNode;
}) {
  return <Scope.Provider value={userId}>{children}</Scope.Provider>;
}
export const useDraftScope = () => useContext(Scope);
export function clearDrafts() {
  try {
    for (const key of Object.keys(localStorage))
      if (key.startsWith("cadeoly-draft:")) localStorage.removeItem(key);
  } catch {}
}

"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "@/i18n/routing";

export function OptionsMenu({
  label,
  className,
  mobileLabel,
  children,
  more = false,
}: {
  label: string;
  className: string;
  mobileLabel?: string;
  children: ReactNode;
  more?: boolean;
}) {
  const pathname = usePathname();
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    function outside(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !ref.current?.contains(event.target) &&
        ref.current
      )
        ref.current.open = false;
    }
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape" && ref.current?.open) {
        ref.current.open = false;
        ref.current.querySelector("summary")?.focus();
      }
    }
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, []);
  return (
    <details
      ref={ref}
      className={className}
      data-home={pathname === "/dashboard" ? "true" : undefined}
      onClick={(event) => {
        if ((event.target as HTMLElement).closest("a") && ref.current)
          ref.current.open = false;
      }}
    >
      <summary aria-label={label}>
        <svg
          aria-hidden="true"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          {more ? (
            <path
              d="M5 12h.01M12 12h.01M19 12h.01"
              strokeWidth="4"
              strokeLinecap="round"
            />
          ) : (
            <>
              <path
                d="m10 3-1 3-3 1-2-1-2 4 2 2v2l-2 2 2 4 3-1 2 1 1 3h4l1-3 2-1 3 1 2-4-2-2v-2l2-2-2-4-2 1-3-1-1-3Z"
                transform="translate(0 -1) scale(.95)"
              />
              <circle cx="11.4" cy="11.4" r="3" />
            </>
          )}
        </svg>
        <span className={mobileLabel ? "options-desktop-label" : undefined}>
          {label}
        </span>
        {mobileLabel && (
          <span className="options-mobile-label">{mobileLabel}</span>
        )}
      </summary>
      {children}
    </details>
  );
}

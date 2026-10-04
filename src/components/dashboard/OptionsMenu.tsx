"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function OptionsMenu({
  label,
  className,
  children,
}: {
  label: string;
  className: string;
  children: ReactNode;
}) {
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
      onClick={(event) => {
        if ((event.target as HTMLElement).closest("a") && ref.current)
          ref.current.open = false;
      }}
    >
      <summary>
        <svg
          aria-hidden="true"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="M4 7h16M4 17h16" />
          <circle cx="9" cy="7" r="3" fill="var(--card)" />
          <circle cx="15" cy="17" r="3" fill="var(--card)" />
        </svg>
        <span>{label}</span>
      </summary>
      {children}
    </details>
  );
}

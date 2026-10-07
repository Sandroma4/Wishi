"use client";
import {
  forwardRef,
  startTransition,
  useEffect,
  useImperativeHandle,
  useRef,
  type FormHTMLAttributes,
} from "react";
import { useDraftScope } from "./DraftScope";
type Props = Omit<
  FormHTMLAttributes<HTMLFormElement>,
  "action" | "onSubmit"
> & {
  action: (data: FormData) => void | Promise<void>;
  draftKey?: string;
  onDraftRestore?: (values: Record<string, string>) => void;
};
// Retain uncontrolled fields when an action reports a recoverable error.
export const PreservedForm = forwardRef<HTMLFormElement, Props>(
  ({ action, draftKey, onDraftRestore, ...props }, ref) => {
    const formRef = useRef<HTMLFormElement>(null);
    const account = useDraftScope();
    const restoreRef = useRef(onDraftRestore);
    restoreRef.current = onDraftRestore;
    const storageKey =
      account && draftKey ? `cadeoly-draft:${account}:${draftKey}` : "";
    useEffect(() => {
      if (!storageKey || !formRef.current) return;
      const form = formRef.current;
      try {
        const raw = localStorage.getItem(storageKey);
        if (raw) {
          const saved = JSON.parse(raw);
          if (saved.expires > Date.now()) {
            for (const [name, value] of Object.entries(saved.values || {})) {
              const field = form.elements.namedItem(name);
              if (
                field instanceof HTMLInputElement &&
                !["password", "file", "hidden"].includes(field.type)
              ) {
                if (field.type === "checkbox") field.checked = value === "on";
                else field.value = String(value).slice(0, 10240);
              } else if (field instanceof HTMLTextAreaElement)
                field.value = String(value).slice(0, 10240);
              else if (
                field instanceof HTMLSelectElement &&
                [...field.options].some((o) => o.value === value)
              )
                field.value = String(value);
            }
            restoreRef.current?.(saved.values || {});
          } else localStorage.removeItem(storageKey);
        }
      } catch {}
      const save = () => {
        try {
          const values: Record<string, string> = {};
          for (const el of Array.from(form.elements)) {
            if (
              (el instanceof HTMLInputElement &&
                !["password", "file", "hidden"].includes(el.type)) ||
              el instanceof HTMLTextAreaElement ||
              el instanceof HTMLSelectElement
            ) {
              if (el.name)
                values[el.name] =
                  el instanceof HTMLInputElement && el.type === "checkbox"
                    ? el.checked
                      ? "on"
                      : "off"
                    : el.value;
            }
          }
          localStorage.setItem(
            storageKey,
            JSON.stringify({ expires: Date.now() + 7 * 86400000, values }),
          );
        } catch {}
      };
      const clear = () => {
        try {
          localStorage.removeItem(storageKey);
        } catch {}
      };
      form.addEventListener("input", save);
      form.addEventListener("change", save);
      form.addEventListener("draft-clear", clear);
      return () => {
        form.removeEventListener("input", save);
        form.removeEventListener("change", save);
        form.removeEventListener("draft-clear", clear);
      };
    }, [storageKey]);
    useImperativeHandle(ref, () => formRef.current!);
    useEffect(() => {
      for (const field of formRef.current?.querySelectorAll(
        '[aria-invalid="true"]',
      ) || []) {
        const options = field.closest("details");
        if (options) options.open = true;
      }
    });
    return (
      <form
        {...props}
        method="post"
        ref={formRef}
        onInvalidCapture={(event) => {
          const options = (event.target as HTMLElement).closest("details");
          if (options) options.open = true;
        }}
        onSubmit={(event) => {
          event.preventDefault();
          if (props["aria-busy"] === true) return;
          const data = new FormData(event.currentTarget);
          startTransition(() => action(data));
        }}
      />
    );
  },
);
PreservedForm.displayName = "PreservedForm";

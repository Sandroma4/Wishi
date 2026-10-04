"use client";
import {
  forwardRef,
  startTransition,
  useEffect,
  useImperativeHandle,
  useRef,
  type FormHTMLAttributes,
} from "react";
type Props = Omit<
  FormHTMLAttributes<HTMLFormElement>,
  "action" | "onSubmit"
> & {
  action: (data: FormData) => void | Promise<void>;
};
// Retain uncontrolled fields when an action reports a recoverable error.
export const PreservedForm = forwardRef<HTMLFormElement, Props>(
  ({ action, ...props }, ref) => {
    const formRef = useRef<HTMLFormElement>(null);
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

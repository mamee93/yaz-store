import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/utils/cn";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  error?: string;
  hint?: string;
};

export function Textarea({
  className,
  label,
  error,
  hint,
  id,
  name,
  rows = 4,
  ...props
}: TextareaProps) {
  const controlId = id ?? name;
  const describedBy = error
    ? `${controlId}-error`
    : hint
      ? `${controlId}-hint`
      : undefined;

  return (
    <label className="block space-y-2">
      {label ? <span className="text-sm font-semibold text-oud-brown">{label}</span> : null}
      <textarea
        id={controlId}
        name={name}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={controlId ? describedBy : undefined}
        className={cn(
          "w-full min-w-0 resize-y rounded-oud border border-oud-brown/15 bg-oud-pearl px-3 py-3 text-sm leading-7 text-oud-ink",
          "placeholder:text-oud-muted/65 transition focus:border-oud-gold focus:bg-white disabled:cursor-not-allowed disabled:bg-oud-beige/35 disabled:text-oud-muted",
          error && "border-red-900/60 focus:border-red-900",
          className
        )}
        {...props}
      />
      {hint && !error && controlId ? (
        <span id={`${controlId}-hint`} className="block text-xs leading-5 text-oud-muted">
          {hint}
        </span>
      ) : null}
      {error && controlId ? (
        <span id={`${controlId}-error`} className="block text-xs leading-5 text-red-900">
          {error}
        </span>
      ) : null}
    </label>
  );
}

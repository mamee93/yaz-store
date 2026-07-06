import type { SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/utils/cn";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
  hint?: string;
};

export function Select({ className, label, error, hint, id, name, children, ...props }: SelectProps) {
  const controlId = id ?? name;
  const describedBy = error
    ? `${controlId}-error`
    : hint
      ? `${controlId}-hint`
      : undefined;

  return (
    <label className="block space-y-2">
      {label ? <span className="text-sm font-semibold text-oud-brown">{label}</span> : null}
      <span className="relative block">
        <select
          id={controlId}
          name={name}
          aria-invalid={error ? true : undefined}
          aria-describedby={controlId ? describedBy : undefined}
          className={cn(
            "h-11 w-full appearance-none rounded-oud border border-oud-brown/15 bg-oud-pearl py-0 pe-10 ps-3 text-sm text-oud-ink",
            "transition focus:border-oud-gold focus:bg-white disabled:cursor-not-allowed disabled:bg-oud-beige/35 disabled:text-oud-muted",
            error && "border-red-900/60 focus:border-red-900",
            className
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-oud-muted"
          aria-hidden="true"
        />
      </span>
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

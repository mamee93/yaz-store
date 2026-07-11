"use client";

import type { ReactNode } from "react";
import { useId, useState } from "react";
import { useFormStatus } from "react-dom";
import { X } from "lucide-react";
import { Button } from "@/components/ui";

type ConfirmActionButtonProps = {
  action: (formData: FormData) => void | Promise<void>;
  triggerLabel: string;
  confirmLabel?: string;
  cancelLabel?: string;
  title: string;
  description: string;
  itemName?: string;
  variant?: "primary" | "secondary" | "ghost" | "gold" | "danger";
  size?: "sm" | "md" | "lg" | "icon";
  className?: string;
  disabled?: boolean;
  icon?: ReactNode;
};

export function ConfirmActionButton({
  action,
  triggerLabel,
  confirmLabel = "حذف نهائي",
  cancelLabel = "إلغاء",
  title,
  description,
  itemName,
  variant = "danger",
  size = "sm",
  className,
  disabled = false,
  icon
}: ConfirmActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dialogTitleId = useId();

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        className={className}
        disabled={disabled}
        leftIcon={icon}
        onClick={() => setIsOpen(true)}
      >
        {triggerLabel}
      </Button>

      {isOpen ? (
        <div className="fixed inset-0 z-[120] grid place-items-center bg-oud-ink/55 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={dialogTitleId}
            className="w-full max-w-md rounded-oud border border-oud-brown/10 bg-oud-pearl p-5 text-right shadow-[0_24px_90px_rgb(0_0_0_/_0.24)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id={dialogTitleId} className="font-display text-2xl font-bold text-oud-brown">
                  {title}
                </h2>
                <p className="mt-2 text-sm leading-7 text-oud-muted">{description}</p>
              </div>
              <button
                type="button"
                className="grid size-9 shrink-0 place-items-center rounded-full border border-oud-brown/10 text-oud-muted transition hover:bg-oud-beige/35 hover:text-oud-brown"
                aria-label="إغلاق"
                onClick={() => setIsOpen(false)}
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>

            {itemName ? (
              <div className="mt-4 rounded-oud border border-red-900/15 bg-red-900/5 px-3 py-2 text-sm font-semibold text-red-900">
                {itemName}
              </div>
            ) : null}

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>
                {cancelLabel}
              </Button>
              <form action={action}>
                <ConfirmSubmitButton label={confirmLabel} />
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function ConfirmSubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant="danger"
      className="w-full sm:w-auto"
      disabled={pending}
      isLoading={pending}
      loadingText="جار التنفيذ..."
    >
      {label}
    </Button>
  );
}

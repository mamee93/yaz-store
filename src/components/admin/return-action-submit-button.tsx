"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui";

type ReturnActionSubmitButtonProps = {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "gold" | "danger";
  leftIcon?: ReactNode;
  className?: string;
};

export function ReturnActionSubmitButton({
  children,
  variant = "primary",
  leftIcon,
  className
}: ReturnActionSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant={variant}
      className={className}
      leftIcon={leftIcon}
      disabled={pending}
      isLoading={pending}
      loadingText="جار التنفيذ..."
    >
      {children}
    </Button>
  );
}

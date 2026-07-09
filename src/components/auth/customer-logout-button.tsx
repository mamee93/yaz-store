"use client";

import { LogOut } from "lucide-react";
import { adminLogoutAction, customerLogoutAction } from "@/features/auth/actions";
import { cn } from "@/utils/cn";

type CustomerLogoutButtonProps = {
  className?: string;
  compact?: boolean;
  scope?: "customer" | "admin";
};

export function CustomerLogoutButton({
  className,
  compact = false,
  scope = "customer"
}: CustomerLogoutButtonProps) {
  const action = scope === "admin" ? adminLogoutAction : customerLogoutAction;

  return (
    <form action={action}>
      <button
        type="submit"
        className={cn(
          "inline-flex h-10 items-center justify-center gap-2 rounded-oud border border-oud-brown/10 bg-white px-4 text-sm font-semibold text-oud-brown transition hover:bg-oud-beige/35",
          className
        )}
      >
        <LogOut className="size-4" aria-hidden="true" />
        {compact ? <span className="sr-only">تسجيل الخروج</span> : <span>تسجيل الخروج</span>}
      </button>
    </form>
  );
}

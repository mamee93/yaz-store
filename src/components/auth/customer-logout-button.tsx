"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
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
  const [isPending, setIsPending] = useState(false);

  function handleLogout() {
    setIsPending(true);
    window.location.assign(scope === "admin" ? "/auth/logout?scope=admin" : "/auth/logout");
  }

  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-oud border border-oud-brown/10 bg-white px-4 text-sm font-semibold text-oud-brown transition hover:bg-oud-beige/35 disabled:cursor-wait disabled:opacity-60",
        className
      )}
      disabled={isPending}
      onClick={handleLogout}
    >
      <LogOut className="size-4" aria-hidden="true" />
      {compact ? <span className="sr-only">تسجيل الخروج</span> : <span>تسجيل الخروج</span>}
    </button>
  );
}

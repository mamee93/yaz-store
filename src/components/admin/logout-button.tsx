"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const [isPending, setIsPending] = useState(false);

  function handleLogout() {
    setIsPending(true);
    window.location.assign("/auth/logout?scope=admin");
  }

  return (
    <button
      type="button"
      className="inline-flex h-9 items-center justify-center gap-2 rounded-oud border border-oud-brown/10 bg-white px-2.5 text-xs font-semibold text-oud-brown transition hover:bg-oud-beige/35 disabled:cursor-wait disabled:opacity-60 md:h-10 md:px-4"
      aria-label="تسجيل الخروج"
      disabled={isPending}
      onClick={handleLogout}
    >
      <LogOut className="size-4" aria-hidden="true" />
      <span className="hidden md:inline">تسجيل الخروج</span>
    </button>
  );
}

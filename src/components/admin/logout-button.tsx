import { LogOut } from "lucide-react";
import { adminLogoutAction } from "@/features/auth/actions";

export function LogoutButton() {
  return (
    <form action={adminLogoutAction}>
      <button
        type="submit"
        className="inline-flex h-9 items-center justify-center gap-2 rounded-oud border border-oud-brown/10 bg-white px-2.5 text-xs font-semibold text-oud-brown transition hover:bg-oud-beige/35 md:h-10 md:px-4"
        aria-label="تسجيل الخروج"
      >
        <LogOut className="size-4" aria-hidden="true" />
        <span className="hidden md:inline">تسجيل الخروج</span>
      </button>
    </form>
  );
}

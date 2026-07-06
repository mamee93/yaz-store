import { LogOut } from "lucide-react";
import { logoutAction } from "@/features/auth/actions";

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="inline-flex h-10 items-center justify-center gap-2 rounded-oud border border-oud-brown/10 bg-white px-4 text-xs font-semibold text-oud-brown transition hover:bg-oud-beige/35"
      >
        <LogOut className="size-4" aria-hidden="true" />
        تسجيل الخروج
      </button>
    </form>
  );
}

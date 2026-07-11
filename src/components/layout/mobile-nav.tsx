"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { Menu, Search, ShoppingBag, UserRound, X } from "lucide-react";
import { CustomerLogoutButton } from "@/components/auth/customer-logout-button";
import { cn } from "@/utils/cn";

type MobileNavProps = {
  items: Array<{
    href: string;
    label: string;
  }>;
  isCustomerLoggedIn?: boolean;
  isAdminLoggedIn?: boolean;
};

export function MobileNav({
  items,
  isCustomerLoggedIn = false,
  isAdminLoggedIn = false
}: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuId = useId();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        className="grid size-10 place-items-center rounded-full text-[#f8f3ee] transition hover:bg-white/10 hover:text-[#eaccb7]"
        aria-label={isOpen ? "إغلاق القائمة" : "فتح القائمة"}
        aria-expanded={isOpen}
        aria-controls={menuId}
        onClick={() => setIsOpen((current) => !current)}
      >
        {isOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
      </button>

      <div
        className={cn(
          "fixed inset-0 z-[90] bg-[#231c18]/55 backdrop-blur-sm transition-opacity",
          isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        )}
        aria-hidden="true"
        onClick={() => setIsOpen(false)}
      />

      <aside
        className={cn(
          "fixed bottom-0 right-0 top-0 z-[100] flex w-[min(86vw,22rem)] flex-col bg-[#f8f3ee] text-[#5b493e] shadow-[0_24px_80px_rgb(0_0_0_/_0.22)] transition duration-300",
          isOpen
            ? "pointer-events-auto translate-x-0 opacity-100"
            : "pointer-events-none translate-x-full opacity-0"
        )}
        id={menuId}
        aria-label="قائمة الجوال"
      >
        <div className="flex h-16 items-center justify-between border-b border-[#6b574a]/10 px-5">
          <div>
            <p className="font-display text-xl font-bold">عود ياز</p>
            <p className="mt-1 text-xs text-[#6b574a]/70">Oud Yaz</p>
          </div>
          <button
            type="button"
            className="grid size-10 place-items-center rounded-full border border-[#6b574a]/15 text-[#5b493e]"
            aria-label="إغلاق القائمة"
            onClick={() => setIsOpen(false)}
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <nav className="grid gap-1" aria-label="قائمة الجوال">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-oud px-3 py-3 text-sm font-semibold transition hover:bg-[#eaccb7]/35"
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="mt-5 grid gap-2 border-t border-[#6b574a]/10 pt-5">
            <MobileAction href="/search" label="البحث" icon={<Search className="size-4" />} onClick={() => setIsOpen(false)} />
            <MobileAction href="/cart" label="السلة" icon={<ShoppingBag className="size-4" />} onClick={() => setIsOpen(false)} />
            <MobileAction
              href={isAdminLoggedIn ? "/admin" : isCustomerLoggedIn ? "/account" : "/login"}
              label={isAdminLoggedIn ? "لوحة التحكم" : isCustomerLoggedIn ? "حسابي" : "تسجيل الدخول"}
              icon={<UserRound className="size-4" />}
              onClick={() => setIsOpen(false)}
            />
            {isCustomerLoggedIn || isAdminLoggedIn ? (
              <CustomerLogoutButton
                className="mt-2 w-full justify-center"
                scope={isAdminLoggedIn ? "admin" : "customer"}
              />
            ) : null}
          </div>
        </div>
      </aside>
    </div>
  );
}

function MobileAction({
  href,
  label,
  icon,
  onClick
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-oud bg-white/55 px-3 py-3 text-sm font-semibold text-[#6b574a] transition hover:bg-[#eaccb7]/35"
      onClick={onClick}
    >
      {icon}
      {label}
    </Link>
  );
}

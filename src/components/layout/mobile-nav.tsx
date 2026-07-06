"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { Menu, Search, ShoppingBag, X, MessageCircle } from "lucide-react";
import { cn } from "@/utils/cn";

type MobileNavProps = {
  items: Array<{
    href: string;
    label: string;
  }>;
};

export function MobileNav({ items }: MobileNavProps) {
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

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        className="grid size-10 place-items-center rounded-oud text-oud-brown transition hover:bg-oud-beige/50"
        aria-label={isOpen ? "إغلاق القائمة" : "فتح القائمة"}
        aria-expanded={isOpen}
        aria-controls={menuId}
        onClick={() => setIsOpen((current) => !current)}
      >
        {isOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
      </button>

      <div
        className={cn(
          "fixed inset-x-0 bottom-0 top-16 z-[90] bg-oud-brown/70 backdrop-blur-sm transition-opacity",
          isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        )}
        aria-hidden="true"
        onClick={() => setIsOpen(false)}
      />

      <div
        className={cn(
          "fixed inset-x-0 top-16 z-[100] border-b border-oud-brown/10 bg-oud-ivory shadow-soft transition",
          isOpen
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-2 opacity-0"
        )}
        id={menuId}
      >
        <div className="container-page space-y-5 py-5">
          <nav className="grid gap-1" aria-label="قائمة الجوال">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-oud px-3 py-3 text-sm font-semibold text-oud-brown transition hover:bg-oud-beige/45"
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="grid gap-2 border-t border-oud-brown/10 pt-4">
            <Link
              href="/search"
              className="flex items-center gap-3 rounded-oud px-3 py-3 text-sm font-semibold text-oud-muted hover:bg-oud-beige/45 hover:text-oud-brown"
              onClick={() => setIsOpen(false)}
            >
              <Search className="size-4" aria-hidden="true" />
              البحث
            </Link>
            <Link
              href="/cart"
              className="flex items-center gap-3 rounded-oud px-3 py-3 text-sm font-semibold text-oud-muted hover:bg-oud-beige/45 hover:text-oud-brown"
              onClick={() => setIsOpen(false)}
            >
              <ShoppingBag className="size-4" aria-hidden="true" />
              السلة
            </Link>
            <Link
              href="/contact"
              className="mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-oud bg-oud-brown px-5 text-sm font-semibold text-oud-ivory shadow-soft transition hover:bg-oud-coffee"
              onClick={() => setIsOpen(false)}
            >
              <MessageCircle className="size-4" aria-hidden="true" />
              تواصل عبر واتساب
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

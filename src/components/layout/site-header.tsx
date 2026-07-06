"use client";

import Link from "next/link";
import { MessageCircle, Search, ShoppingBag } from "lucide-react";
import { siteConfig } from "@/constants/site";
import { useCart } from "@/hooks/use-cart";
import { MobileNav } from "./mobile-nav";

export const storeNavItems = [
  { href: "/", label: "الرئيسية" },
  { href: "/products", label: "المنتجات" },
  { href: "/offers", label: "العروض" },
  { href: "/about", label: "عن عود ياز" },
  { href: "/contact", label: "تواصل معنا" }
];

export function SiteHeader({ storeName }: { storeName?: string }) {
  const { itemCount } = useCart();
  const displayName = storeName ?? siteConfig.name;

  return (
    <header className="sticky top-0 z-40 border-b border-oud-brown/10 bg-oud-ivory/95 backdrop-blur-xl">
      <div className="container-page flex h-16 items-center justify-between gap-3">
        <Link href="/" className="group flex items-center gap-3" aria-label={displayName}>
          <span className="grid size-10 place-items-center rounded-oud border border-oud-gold/35 bg-oud-brown font-display text-lg font-bold text-oud-gold shadow-gold">
            ع
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-display text-2xl font-bold text-oud-brown">
              {displayName}
            </span>
            <span className="mt-1 hidden text-[11px] font-medium text-oud-muted sm:block">
              Oud Yaz
            </span>
          </span>
        </Link>

        <nav
          className="hidden items-center gap-7 text-sm font-semibold text-oud-muted lg:flex"
          aria-label="التنقل الرئيسي"
        >
          {storeNavItems.map((item) => (
            <Link key={item.href} href={item.href} className="transition hover:text-oud-brown">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1 text-oud-brown sm:gap-2">
          <Link
            href="/search"
            aria-label="البحث"
            className="grid size-10 place-items-center rounded-oud transition hover:bg-oud-beige/50"
          >
            <Search size={20} aria-hidden="true" />
          </Link>
          <Link
            href="/cart"
            aria-label="السلة"
            className="relative grid size-10 place-items-center rounded-oud transition hover:bg-oud-beige/50"
          >
            <ShoppingBag size={20} aria-hidden="true" />
            {itemCount > 0 ? (
              <span className="absolute -left-1 -top-1 grid min-w-5 place-items-center rounded-full bg-oud-gold px-1 text-[11px] font-bold text-oud-brown">
                {itemCount}
              </span>
            ) : null}
            <span className="sr-only">عدد عناصر السلة: {itemCount}</span>
          </Link>
          <Link
            href="/contact"
            className="hidden h-9 items-center justify-center gap-2 rounded-md border border-oud-gold/35 bg-oud-gold/10 px-3 text-xs font-semibold text-oud-brown transition hover:bg-oud-gold/20 md:inline-flex"
          >
            <MessageCircle className="size-4" aria-hidden="true" />
            واتساب
          </Link>
          <MobileNav items={storeNavItems} />
        </div>
      </div>
    </header>
  );
}

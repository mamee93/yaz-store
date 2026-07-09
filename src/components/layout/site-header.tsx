"use client";

import Link from "next/link";
import Image from "next/image";
import { MessageCircle, Search, ShoppingBag, UserRound } from "lucide-react";
import { CustomerLogoutButton } from "@/components/auth/customer-logout-button";
import { siteConfig } from "@/constants/site";
import { useCart } from "@/hooks/use-cart";
import { MobileNav } from "./mobile-nav";
import type { AdminProfile, CustomerProfile } from "@/features/auth/queries";

export const storeNavItems = [
  { href: "/", label: "الرئيسية" },
  { href: "/products", label: "المنتجات" },
  { href: "/offers", label: "العروض" },
  { href: "/about", label: "عن عود ياز" },
  { href: "/contact", label: "تواصل معنا" }
];

export function SiteHeader({
  storeName,
  logoUrl,
  customer,
  admin
}: {
  storeName?: string;
  logoUrl?: string | null;
  customer?: CustomerProfile | null;
  admin?: AdminProfile | null;
}) {
  const { itemCount } = useCart();
  const displayName = storeName ?? siteConfig.name;
  const normalizedLogoUrl = logoUrl?.trim() || null;
  const isCustomerLoggedIn = Boolean(customer);
  const isAdminLoggedIn = Boolean(admin);
  const accountHref = isAdminLoggedIn ? "/admin" : isCustomerLoggedIn ? "/account" : "/login";
  const accountLabel = isAdminLoggedIn ? "لوحة التحكم" : isCustomerLoggedIn ? "حسابي" : "تسجيل الدخول";

  return (
    <header className="sticky top-0 z-40 border-b border-oud-brown/10 bg-oud-ivory/95 backdrop-blur-xl">
      <div className="container-page flex h-16 items-center justify-between gap-3">
        <Link href="/" className="group flex min-w-0 items-center gap-2 sm:gap-3" aria-label={displayName}>
          <LogoMark logoUrl={normalizedLogoUrl} storeName={displayName} />
          <span className="flex min-w-0 flex-col leading-none">
            <span className="truncate font-display text-xl font-bold text-oud-brown sm:text-2xl">
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

        <div className="flex shrink-0 items-center gap-1 text-oud-brown sm:gap-2">
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
            href={accountHref}
            className="hidden h-9 items-center justify-center gap-2 rounded-md px-3 text-xs font-semibold text-oud-brown transition hover:bg-oud-beige/50 md:inline-flex"
          >
            <UserRound className="size-4" aria-hidden="true" />
            {accountLabel}
          </Link>
          {isCustomerLoggedIn || isAdminLoggedIn ? (
            <CustomerLogoutButton
              className="hidden h-9 px-3 text-xs md:inline-flex"
              compact
              scope={isAdminLoggedIn ? "admin" : "customer"}
            />
          ) : null}
          <Link
            href="/contact"
            className="hidden h-9 items-center justify-center gap-2 rounded-md border border-oud-gold/35 bg-oud-gold/10 px-3 text-xs font-semibold text-oud-brown transition hover:bg-oud-gold/20 md:inline-flex"
          >
            <MessageCircle className="size-4" aria-hidden="true" />
            واتساب
          </Link>
          <MobileNav
            items={storeNavItems}
            isCustomerLoggedIn={isCustomerLoggedIn}
            isAdminLoggedIn={isAdminLoggedIn}
          />
        </div>
      </div>
    </header>
  );
}

function LogoMark({
  logoUrl,
  storeName
}: {
  logoUrl: string | null;
  storeName: string;
}) {
  if (logoUrl) {
    return (
      <span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-oud border border-oud-gold/35 bg-oud-pearl shadow-gold lg:size-12">
        <Image
          src={logoUrl}
          alt={`${storeName} logo`}
          width={48}
          height={48}
          unoptimized
          className="h-full w-full object-contain p-1.5"
        />
      </span>
    );
  }

  return (
    <span className="grid size-11 shrink-0 place-items-center rounded-oud border border-oud-gold/35 bg-oud-brown font-display text-lg font-bold text-oud-gold shadow-gold lg:size-12 lg:text-xl">
      ع
    </span>
  );
}

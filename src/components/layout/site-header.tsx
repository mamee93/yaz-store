"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, ShoppingBag, UserRound } from "lucide-react";
import { CustomerLogoutButton } from "@/components/auth/customer-logout-button";
import { siteConfig } from "@/constants/site";
import { useCart } from "@/hooks/use-cart";
import { cn } from "@/utils/cn";
import { MobileNav } from "./mobile-nav";
import type { AdminProfile, CustomerProfile } from "@/features/auth/queries";

export const storeNavItems = [
  { href: "/", label: "الرئيسية" },
  { href: "/products", label: "المتجر" },
  { href: "/#featured-categories", label: "المجموعات" },
  { href: "/offers", label: "المناسبات" },
  { href: "/about", label: "عن عود ياز" },
  { href: "/contact", label: "تواصل معنا" }
];

type SiteHeaderProps = {
  storeName?: string;
  logoUrl?: string | null;
  customer?: CustomerProfile | null;
  admin?: AdminProfile | null;
};

export function SiteHeader({ storeName, logoUrl, customer, admin }: SiteHeaderProps) {
  const { itemCount } = useCart();
  const pathname = usePathname();
  const displayName = storeName ?? siteConfig.name;
  const normalizedLogoUrl = logoUrl?.trim() || null;
  const isCustomerLoggedIn = Boolean(customer);
  const isAdminLoggedIn = Boolean(admin);
  const accountHref = isAdminLoggedIn ? "/admin" : isCustomerLoggedIn ? "/account" : "/login";
  const accountLabel = isAdminLoggedIn ? "لوحة التحكم" : isCustomerLoggedIn ? "حسابي" : "تسجيل الدخول";

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#5b493e]/95 text-[#f8f3ee] shadow-[0_12px_40px_rgb(35_28_24_/_0.12)] backdrop-blur-xl">
      <div className="container-page flex h-16 items-center justify-between gap-3 lg:h-[4.5rem]">
        <Link href="/" className="group flex min-w-0 items-center gap-2 sm:gap-3" aria-label={displayName}>
          <LogoMark logoUrl={normalizedLogoUrl} storeName={displayName} />
          <span className="flex min-w-0 flex-col leading-none">
            <span className="truncate font-display text-xl font-bold text-[#f8f3ee] sm:text-2xl">
              {displayName}
            </span>
            <span className="mt-1 hidden text-[11px] font-medium text-[#eaccb7]/75 sm:block">
              Oud Yaz
            </span>
          </span>
        </Link>

        <nav
          className="hidden items-center gap-6 text-sm font-semibold text-[#f8f3ee]/78 lg:flex xl:gap-8"
          aria-label="التنقل الرئيسي"
        >
          {storeNavItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : item.href.startsWith("/#")
                  ? pathname === "/"
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative py-2 transition hover:text-[#eaccb7]",
                  isActive &&
                    "text-[#f8f3ee] after:absolute after:inset-x-1 after:-bottom-1 after:h-px after:bg-[#d7b576]"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-1 text-[#f8f3ee] sm:gap-2">
          <Link
            href="/search"
            aria-label="البحث"
            className="grid size-10 place-items-center rounded-full transition hover:bg-white/10 hover:text-[#eaccb7]"
          >
            <Search size={20} aria-hidden="true" />
          </Link>
          <Link
            href={accountHref}
            aria-label={accountLabel}
            className="hidden size-10 place-items-center rounded-full transition hover:bg-white/10 hover:text-[#eaccb7] md:grid"
          >
            <UserRound size={20} aria-hidden="true" />
          </Link>
          <Link
            href="/cart"
            aria-label="السلة"
            className="relative grid size-10 place-items-center rounded-full transition hover:bg-white/10 hover:text-[#eaccb7]"
          >
            <ShoppingBag size={20} aria-hidden="true" />
            {itemCount > 0 ? (
              <span className="absolute -left-1 -top-1 grid min-w-5 place-items-center rounded-full bg-[#eaccb7] px-1 text-[11px] font-bold text-[#5b493e]">
                {itemCount}
              </span>
            ) : null}
            <span className="sr-only">عدد عناصر السلة: {itemCount}</span>
          </Link>
          {isCustomerLoggedIn || isAdminLoggedIn ? (
            <CustomerLogoutButton
              className="hidden h-9 border-white/15 bg-white/10 px-3 text-xs text-[#f8f3ee] hover:bg-white/15 md:inline-flex"
              compact
              scope={isAdminLoggedIn ? "admin" : "customer"}
            />
          ) : null}
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

function LogoMark({ logoUrl, storeName }: { logoUrl: string | null; storeName: string }) {
  if (logoUrl) {
    return (
      <span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-full border border-[#eaccb7]/40 bg-[#f8f3ee] shadow-[0_12px_32px_rgb(0_0_0_/_0.14)] lg:size-12">
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
    <span className="grid size-11 shrink-0 place-items-center rounded-full border border-[#eaccb7]/45 bg-[#6b574a] font-display text-lg font-bold text-[#eaccb7] shadow-[0_12px_32px_rgb(0_0_0_/_0.14)] lg:size-12 lg:text-xl">
      ع
    </span>
  );
}

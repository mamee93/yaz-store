import Link from "next/link";
import Image from "next/image";
import {
  Boxes,
  BellRing,
  ChartNoAxesColumnIncreasing,
  ClipboardList,
  ExternalLink,
  FolderTree,
  Image as ImageIcon,
  LayoutDashboard,
  Settings,
  Truck,
  TicketPercent,
  UserCog,
  Users
} from "lucide-react";
import { LogoutButton } from "@/components/admin/logout-button";
import { NotificationsDropdown } from "@/components/admin/notifications-dropdown";
import { canAccessAdminPath, type AdminRole } from "@/constants/admin-roles";
import { siteConfig } from "@/constants/site";

const adminNavItems = [
  { href: "/admin", label: "لوحة التحكم", icon: LayoutDashboard },
  { href: "/admin/products", label: "المنتجات", icon: Boxes },
  { href: "/admin/categories", label: "التصنيفات", icon: FolderTree },
  { href: "/admin/orders", label: "الطلبات", icon: ClipboardList },
  { href: "/admin/team", label: "الفريق", icon: UserCog },
  { href: "/admin/notifications", label: "التنبيهات", icon: BellRing },
  { href: "/admin/customers", label: "العملاء", icon: Users },
  { href: "/admin/coupons", label: "الكوبونات", icon: TicketPercent },
  { href: "/admin/shipping", label: "التوصيل", icon: Truck },
  { href: "/admin/inventory", label: "المخزون", icon: ChartNoAxesColumnIncreasing },
  { href: "/admin/banners", label: "البنرات", icon: ImageIcon },
  { href: "/admin/settings", label: "الإعدادات", icon: Settings }
];

export function AdminShell({
  children,
  storeName,
  logoUrl,
  adminRole
}: {
  children: React.ReactNode;
  storeName?: string;
  logoUrl?: string | null;
  adminRole: AdminRole;
}) {
  const displayName = storeName ?? siteConfig.name;
  const visibleNavItems = adminNavItems.filter((item) => canAccessAdminPath(adminRole, item.href));
  const canViewNotifications = canAccessAdminPath(adminRole, "/admin/notifications");

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f6f0e7] text-oud-ink">
      <aside className="fixed inset-y-0 right-0 z-40 hidden w-[260px] overflow-y-auto border-l border-oud-brown/10 bg-oud-pearl/95 p-4 shadow-soft lg:block">
        <Link href="/admin" className="flex items-center gap-3 rounded-oud px-2 py-3">
          <AdminLogoMark logoUrl={logoUrl} storeName={displayName} />
          <span>
            <span className="block font-display text-2xl font-bold text-oud-brown">
              {displayName}
            </span>
            <span className="block text-xs text-oud-muted">لوحة الإدارة</span>
          </span>
        </Link>

        <nav className="mt-6 space-y-1 text-sm" aria-label="تنقل الإدارة">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-oud px-3 py-2.5 font-semibold text-oud-muted transition hover:bg-oud-beige/45 hover:text-oud-brown"
              >
                <Icon className="size-4" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="w-full min-w-0 max-w-full lg:pr-[260px]">
        <header className="sticky top-0 z-30 border-b border-oud-brown/10 bg-oud-pearl/90 backdrop-blur-xl">
          <div className="flex min-h-14 w-full min-w-0 items-center justify-between gap-2 px-3 py-2 sm:px-4 md:min-h-16 md:gap-3 md:px-6 md:py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold leading-5 text-oud-brown">
                إدارة عود ياز
              </p>
              <p className="text-xs leading-4 text-oud-muted">
                <span className="md:hidden">لوحة الإدارة</span>
                <span className="hidden md:inline">واجهة تشغيل ثابتة للعرض فقط</span>
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              {canViewNotifications ? <NotificationsDropdown /> : null}
              <Link
                href="/"
                className="inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-oud border border-oud-brown/10 bg-white px-2.5 text-xs font-semibold text-oud-brown transition hover:bg-oud-beige/35 md:h-10 md:px-4"
                aria-label="عرض المتجر"
              >
                <ExternalLink className="size-4" aria-hidden="true" />
                <span className="hidden md:inline">عرض المتجر</span>
              </Link>
              <LogoutButton />
            </div>
          </div>
        </header>

        <nav
          className="max-w-full overflow-hidden border-b border-oud-brown/10 bg-oud-pearl/80 px-3 py-2 sm:px-4 md:px-6 md:py-3 lg:hidden"
          aria-label="تنقل الإدارة"
        >
          <div className="flex max-w-full gap-2 overflow-x-auto pb-1">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex h-9 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-oud-brown/10 bg-white px-3 text-xs font-semibold text-oud-muted transition hover:bg-oud-beige/35 hover:text-oud-brown md:px-4"
                >
                  <Icon className="size-4" aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        <main className="w-full min-w-0 max-w-full overflow-x-hidden p-3 sm:p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

function AdminLogoMark({
  logoUrl,
  storeName
}: {
  logoUrl?: string | null;
  storeName: string;
}) {
  if (logoUrl) {
    return (
      <span className="grid size-11 place-items-center overflow-hidden rounded-oud border border-oud-gold/35 bg-oud-ivory shadow-soft">
        <Image
          src={logoUrl}
          alt={`${storeName} logo`}
          width={44}
          height={44}
          unoptimized
          className="h-full w-full object-contain p-1.5"
        />
      </span>
    );
  }

  return (
    <span className="grid size-11 place-items-center rounded-oud bg-oud-brown font-display text-lg font-bold text-oud-gold">
      ع
    </span>
  );
}

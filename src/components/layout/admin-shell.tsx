import Link from "next/link";
import {
  Boxes,
  ChartNoAxesColumnIncreasing,
  ClipboardList,
  FolderTree,
  Image,
  LayoutDashboard,
  Settings,
  Users
} from "lucide-react";
import { LogoutButton } from "@/components/admin/logout-button";
import { siteConfig } from "@/constants/site";

const adminNavItems = [
  { href: "/admin", label: "لوحة التحكم", icon: LayoutDashboard },
  { href: "/admin/products", label: "المنتجات", icon: Boxes },
  { href: "/admin/categories", label: "التصنيفات", icon: FolderTree },
  { href: "/admin/orders", label: "الطلبات", icon: ClipboardList },
  { href: "/admin/customers", label: "العملاء", icon: Users },
  { href: "/admin/inventory", label: "المخزون", icon: ChartNoAxesColumnIncreasing },
  { href: "/admin/banners", label: "البنرات", icon: Image },
  { href: "/admin/settings", label: "الإعدادات", icon: Settings }
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f6f0e7] text-oud-ink">
      <aside className="fixed inset-y-0 right-0 z-40 hidden w-[260px] overflow-y-auto border-l border-oud-brown/10 bg-oud-pearl/95 p-4 shadow-soft lg:block">
        <Link href="/admin" className="flex items-center gap-3 rounded-oud px-2 py-3">
          <span className="grid size-10 place-items-center rounded-oud bg-oud-brown font-display text-lg font-bold text-oud-gold">
            ع
          </span>
          <span>
            <span className="block font-display text-2xl font-bold text-oud-brown">
              {siteConfig.name}
            </span>
            <span className="block text-xs text-oud-muted">لوحة الإدارة</span>
          </span>
        </Link>

        <nav className="mt-6 space-y-1 text-sm" aria-label="تنقل الإدارة">
          {adminNavItems.map((item) => {
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
          <div className="flex min-h-16 w-full min-w-0 flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4 md:px-6">
            <div className="min-w-0">
              <p className="text-sm font-bold text-oud-brown">إدارة عود ياز</p>
              <p className="text-xs text-oud-muted">واجهة تشغيل ثابتة للعرض فقط</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/"
                className="inline-flex h-10 items-center justify-center whitespace-nowrap rounded-oud border border-oud-brown/10 bg-white px-4 text-xs font-semibold text-oud-brown transition hover:bg-oud-beige/35"
              >
                عرض المتجر
              </Link>
              <LogoutButton />
            </div>
          </div>
        </header>

        <nav
          className="max-w-full overflow-hidden border-b border-oud-brown/10 bg-oud-pearl/80 px-3 py-3 sm:px-4 md:px-6 lg:hidden"
          aria-label="تنقل الإدارة"
        >
          <div className="flex max-w-full gap-2 overflow-x-auto pb-1">
            {adminNavItems.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-oud-brown/10 bg-white px-4 py-2 text-xs font-semibold text-oud-muted transition hover:bg-oud-beige/35 hover:text-oud-brown"
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

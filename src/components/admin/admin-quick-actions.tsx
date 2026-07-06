import Link from "next/link";
import { Boxes, ClipboardList, Image, Settings } from "lucide-react";
import { Card } from "@/components/ui";

const quickActions = [
  { href: "/admin/products/new", label: "إضافة منتج", icon: Boxes },
  { href: "/admin/orders", label: "عرض الطلبات", icon: ClipboardList },
  { href: "/admin/banners", label: "تعديل البنرات", icon: Image },
  { href: "/admin/settings", label: "الإعدادات", icon: Settings }
];

export function AdminQuickActions() {
  return (
    <Card className="p-5 shadow-none">
      <h2 className="font-display text-2xl font-bold text-oud-brown">إجراءات سريعة</h2>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {quickActions.map((action) => {
          const Icon = action.icon;

          return (
            <Link
              key={action.href}
              href={action.href}
              className="flex items-center gap-3 rounded-oud border border-oud-brown/10 bg-white p-4 text-sm font-semibold text-oud-brown transition hover:border-oud-gold/35 hover:bg-oud-beige/25"
            >
              <span className="grid size-10 place-items-center rounded-oud bg-oud-brown text-oud-gold">
                <Icon className="size-4" aria-hidden="true" />
              </span>
              {action.label}
            </Link>
          );
        })}
      </div>
    </Card>
  );
}

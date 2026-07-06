import { BadgePercent, CheckCircle2, Clock3, TicketPercent } from "lucide-react";
import { Card } from "@/components/ui";
import type { AdminCouponStats } from "@/features/coupons/queries";

type CouponStatsCardsProps = {
  stats: AdminCouponStats;
};

export function CouponStatsCards({ stats }: CouponStatsCardsProps) {
  const items = [
    { label: "كل الكوبونات", value: stats.total, icon: TicketPercent },
    { label: "الكوبونات النشطة", value: stats.active, icon: CheckCircle2 },
    { label: "الكوبونات المنتهية", value: stats.expired, icon: Clock3 },
    { label: "إجمالي الاستخدام", value: stats.totalRedemptions, icon: BadgePercent }
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label} className="p-5 shadow-none">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-oud-muted">{item.label}</p>
              <p className="mt-2 text-2xl font-bold text-oud-brown">{item.value}</p>
            </div>
            <span className="inline-flex size-10 items-center justify-center rounded-oud bg-oud-gold/15 text-oud-brown">
              <item.icon className="size-5" aria-hidden="true" />
            </span>
          </div>
        </Card>
      ))}
    </div>
  );
}

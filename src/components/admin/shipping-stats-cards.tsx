import { MapPinned, PackageCheck, Truck, XCircle } from "lucide-react";
import { Card } from "@/components/ui";
import type { ShippingStats } from "@/features/shipping/queries";

type ShippingStatsCardsProps = {
  stats: ShippingStats;
};

export function ShippingStatsCards({ stats }: ShippingStatsCardsProps) {
  const items = [
    { label: "كل المناطق", value: stats.total, icon: MapPinned },
    { label: "المناطق النشطة", value: stats.active, icon: Truck },
    { label: "المناطق المتوقفة", value: stats.inactive, icon: XCircle },
    { label: "شحن مجاني", value: stats.freeShippingEnabled, icon: PackageCheck }
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

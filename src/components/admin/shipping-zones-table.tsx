import Link from "next/link";
import { Eye, PauseCircle, PlayCircle } from "lucide-react";
import { Button, Card, EmptyState, Price } from "@/components/ui";
import {
  deactivateShippingZoneAction,
  toggleShippingZoneStatusAction
} from "@/features/shipping/actions";
import type { ShippingZoneRow } from "@/features/shipping/queries";
import { ShippingStatusBadge } from "./shipping-status-badge";

type ShippingZonesTableProps = {
  zones: ShippingZoneRow[];
};

export function ShippingZonesTable({ zones }: ShippingZonesTableProps) {
  if (zones.length === 0) {
    return (
      <EmptyState
        title="لا توجد مناطق توصيل"
        description="أضف مناطق التوصيل ورسومها لتفعيل حساب الشحن في checkout."
      />
    );
  }

  return (
    <Card className="overflow-hidden shadow-none">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[58rem] text-right text-sm">
          <thead className="bg-oud-beige/35 text-xs text-oud-muted">
            <tr>
              <th className="px-5 py-3 font-semibold">المنطقة</th>
              <th className="px-5 py-3 font-semibold">المدينة</th>
              <th className="px-5 py-3 font-semibold">رسوم التوصيل</th>
              <th className="px-5 py-3 font-semibold">حد الشحن المجاني</th>
              <th className="px-5 py-3 font-semibold">المدة</th>
              <th className="px-5 py-3 font-semibold">الحالة</th>
              <th className="px-5 py-3 font-semibold">إجراء</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-oud-brown/10">
            {zones.map((zone) => {
              const toggleAction = toggleShippingZoneStatusAction.bind(null, zone.id, !zone.is_active);
              const deactivateAction = deactivateShippingZoneAction.bind(null, zone.id);

              return (
                <tr key={zone.id} className="bg-oud-pearl">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-oud-brown">{zone.name}</p>
                    <p className="mt-1 text-xs text-oud-muted">{zone.area}</p>
                  </td>
                  <td className="px-5 py-4 text-oud-muted">{zone.city}</td>
                  <td className="px-5 py-4">
                    <Price value={zone.delivery_fee_omr} />
                  </td>
                  <td className="px-5 py-4 text-oud-muted">
                    {zone.free_shipping_minimum_omr !== null ? (
                      <Price value={zone.free_shipping_minimum_omr} />
                    ) : (
                      "غير مفعل"
                    )}
                  </td>
                  <td className="px-5 py-4 text-oud-muted">
                    {zone.estimated_delivery_time ?? "غير محدد"}
                  </td>
                  <td className="px-5 py-4">
                    <ShippingStatusBadge zone={zone} />
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/admin/shipping/${zone.id}/edit`}
                        className="inline-flex items-center gap-2 text-xs font-semibold text-oud-brown"
                      >
                        <Eye className="size-4" aria-hidden="true" />
                        تعديل
                      </Link>
                      <form action={toggleAction}>
                        <Button
                          type="submit"
                          size="sm"
                          variant={zone.is_active ? "secondary" : "gold"}
                          leftIcon={
                            zone.is_active ? (
                              <PauseCircle className="size-4" />
                            ) : (
                              <PlayCircle className="size-4" />
                            )
                          }
                        >
                          {zone.is_active ? "إيقاف" : "تفعيل"}
                        </Button>
                      </form>
                      <form action={deactivateAction}>
                        <Button type="submit" size="sm" variant="danger">
                          حذف آمن
                        </Button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

import { Badge, Card } from "@/components/ui";
import type { DashboardAnalytics } from "@/features/analytics/queries";

type OrdersStatusChartProps = {
  statusCounts: DashboardAnalytics["statusCounts"];
};

const statusLabels = {
  pending: "قيد التأكيد",
  confirmed: "مؤكد",
  preparing: "قيد التجهيز",
  out_for_delivery: "خرج للتوصيل",
  completed: "مكتمل",
  cancelled: "ملغي"
};

export function OrdersStatusChart({ statusCounts }: OrdersStatusChartProps) {
  const entries = Object.entries(statusCounts) as Array<
    [keyof typeof statusLabels, number]
  >;
  const total = entries.reduce((sum, [, count]) => sum + count, 0);

  return (
    <Card className="p-5 shadow-none">
      <h2 className="font-display text-2xl font-bold text-oud-brown">حالات الطلبات</h2>
      <p className="mt-1 text-xs text-oud-muted">توزيع الطلبات حسب الحالة الحالية</p>
      <div className="mt-5 space-y-4">
        {entries.map(([status, count]) => {
          const percent = total > 0 ? (count / total) * 100 : 0;

          return (
            <div key={status} className="space-y-2">
              <div className="flex items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant={status === "cancelled" ? "danger" : "soft"}>
                    {statusLabels[status]}
                  </Badge>
                  <span className="font-semibold text-oud-brown">{count}</span>
                </div>
                <span className="text-xs text-oud-muted">{percent.toFixed(0)}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-oud-beige/50">
                <div className="h-full rounded-full bg-oud-brown" style={{ width: `${percent}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

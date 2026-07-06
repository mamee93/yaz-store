import { Card, Price } from "@/components/ui";
import type { SalesTrendPoint } from "@/features/analytics/queries";

type SalesChartProps = {
  title: string;
  description: string;
  points: SalesTrendPoint[];
};

export function SalesChart({ title, description, points }: SalesChartProps) {
  const maxRevenue = Math.max(...points.map((point) => point.revenue), 0);

  return (
    <Card className="p-5 shadow-none">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-oud-brown">{title}</h2>
          <p className="mt-1 text-xs text-oud-muted">{description}</p>
        </div>
        <Price value={points.reduce((total, point) => total + point.revenue, 0)} />
      </div>

      <div className="mt-6 flex h-56 items-end gap-2 overflow-x-auto pb-2">
        {points.map((point) => {
          const height = maxRevenue > 0 ? Math.max(8, (point.revenue / maxRevenue) * 100) : 8;

          return (
            <div key={point.date} className="flex min-w-10 flex-1 flex-col items-center gap-2">
              <div className="flex h-40 w-full items-end rounded-full bg-oud-beige/45 px-1">
                <div
                  className="w-full rounded-full bg-oud-gold"
                  style={{ height: `${height}%` }}
                  title={`${point.label}: ${point.revenue.toFixed(3)} OMR`}
                />
              </div>
              <div className="text-center">
                <p className="text-[11px] font-semibold text-oud-brown">{point.orders}</p>
                <p className="text-[10px] text-oud-muted">{point.label}</p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

import { Badge, Card, EmptyState, Price } from "@/components/ui";
import type { CouponPerformanceItem } from "@/features/analytics/queries";

type CouponPerformanceCardProps = {
  coupons: CouponPerformanceItem[];
};

export function CouponPerformanceCard({ coupons }: CouponPerformanceCardProps) {
  return (
    <Card className="p-5 shadow-none">
      <h2 className="font-display text-2xl font-bold text-oud-brown">أداء الكوبونات</h2>
      <p className="mt-1 text-xs text-oud-muted">الاستخدام والإيرادات المرتبطة بالكوبونات</p>
      {coupons.length === 0 ? (
        <EmptyState title="لا توجد استخدامات كوبونات" description="ستظهر الكوبونات بعد استخدامها في الطلبات." />
      ) : (
        <div className="mt-5 space-y-4">
          {coupons.map((coupon) => (
            <div key={coupon.code} className="rounded-oud bg-oud-beige/30 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-oud-brown" dir="ltr">
                      {coupon.code}
                    </p>
                    <Badge variant={coupon.isActive ? "success" : "soft"}>
                      {coupon.isActive ? "نشط" : "متوقف"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-oud-muted">{coupon.name}</p>
                </div>
                <Price value={coupon.revenue} />
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-oud-muted">
                <span>الاستخدام: {coupon.usedCount}</span>
                <span>
                  الخصم: <Price value={coupon.discount} className="text-xs text-oud-muted" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

import Link from "next/link";
import { Badge, Card, EmptyState, Price } from "@/components/ui";
import type { RecentOrderItem } from "@/features/analytics/queries";

type RecentOrdersCardProps = {
  orders: RecentOrderItem[];
};

const statusLabels = {
  pending: "قيد التأكيد",
  confirmed: "مؤكد",
  preparing: "قيد التجهيز",
  out_for_delivery: "خرج للتوصيل",
  completed: "مكتمل",
  cancelled: "ملغي"
};

export function RecentOrdersCard({ orders }: RecentOrdersCardProps) {
  return (
    <Card className="overflow-hidden shadow-none">
      <div className="flex items-start justify-between gap-3 border-b border-oud-brown/10 p-5">
        <div>
          <h2 className="font-display text-2xl font-bold text-oud-brown">أحدث الطلبات</h2>
          <p className="mt-1 text-xs text-oud-muted">آخر الطلبات المسجلة مع الإداري المنسوب إن وجد</p>
        </div>
        <Link href="/admin/orders" className="text-xs font-semibold text-oud-brown">
          كل الطلبات
        </Link>
      </div>
      {orders.length === 0 ? (
        <div className="p-5">
          <EmptyState title="لا توجد طلبات" description="ستظهر أحدث الطلبات هنا." />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[52rem] text-right text-sm">
            <thead className="bg-oud-beige/35 text-xs text-oud-muted">
              <tr>
                <th className="px-5 py-3 font-semibold">رقم الطلب</th>
                <th className="px-5 py-3 font-semibold">العميل</th>
                <th className="px-5 py-3 font-semibold">الحالة</th>
                <th className="px-5 py-3 font-semibold">الإجمالي</th>
                <th className="px-5 py-3 font-semibold">الإداري</th>
                <th className="px-5 py-3 font-semibold">التاريخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-oud-brown/10">
              {orders.map((order) => (
                <tr key={order.id} className="bg-oud-pearl">
                  <td className="px-5 py-4 font-semibold text-oud-brown" dir="ltr">
                    <Link href={`/admin/orders/${order.id}`}>{order.orderNumber}</Link>
                  </td>
                  <td className="px-5 py-4 text-oud-ink">{order.customer}</td>
                  <td className="px-5 py-4">
                    <Badge variant={order.status === "cancelled" ? "danger" : "gold"}>
                      {statusLabels[order.status]}
                    </Badge>
                  </td>
                  <td className="px-5 py-4">
                    <Price value={order.total} />
                  </td>
                  <td className="px-5 py-4 text-oud-muted">{order.attributedAdminName ?? "-"}</td>
                  <td className="px-5 py-4 text-oud-muted">{formatDate(order.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ar-OM", {
    dateStyle: "medium"
  }).format(new Date(value));
}

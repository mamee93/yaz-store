import Link from "next/link";
import { Eye } from "lucide-react";
import { Badge, Card, EmptyState, Price } from "@/components/ui";
import { orderStatusLabels } from "@/components/admin/order-status-select";
import type { AdminOrderListItem } from "@/features/orders/queries";

type OrdersTableProps = {
  orders: AdminOrderListItem[];
};

const paymentMethodLabels = {
  cash_on_delivery: "الدفع عند الاستلام",
  bank_transfer: "التحويل البنكي",
  manual_confirmation: "تأكيد يدوي",
  tap_payments: "دفع إلكتروني"
};

export function OrdersTable({ orders }: OrdersTableProps) {
  if (orders.length === 0) {
    return (
      <EmptyState
        title="لا توجد طلبات بعد"
        description="ستظهر الطلبات هنا بعد إتمام العملاء لعملية الشراء."
      />
    );
  }

  return (
    <Card className="overflow-hidden shadow-none">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[52rem] text-right text-sm">
          <thead className="bg-oud-beige/35 text-xs text-oud-muted">
            <tr>
              <th className="px-5 py-3 font-semibold">رقم الطلب</th>
              <th className="px-5 py-3 font-semibold">العميل</th>
              <th className="px-5 py-3 font-semibold">الهاتف</th>
              <th className="px-5 py-3 font-semibold">الدفع</th>
              <th className="px-5 py-3 font-semibold">الحالة</th>
              <th className="px-5 py-3 font-semibold">الإجمالي</th>
              <th className="px-5 py-3 font-semibold">إجراء</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-oud-brown/10">
            {orders.map((order) => (
              <tr key={order.id} className="bg-oud-pearl">
                <td className="px-5 py-4 font-semibold text-oud-brown" dir="ltr">
                  {order.order_number}
                </td>
                <td className="px-5 py-4 text-oud-ink">{order.customer_name_snapshot}</td>
                <td className="px-5 py-4 text-oud-muted" dir="ltr">
                  {order.customer_phone_snapshot}
                </td>
                <td className="px-5 py-4 text-oud-muted">
                  {paymentMethodLabels[order.payment_method]}
                </td>
                <td className="px-5 py-4">
                  <Badge variant={getStatusBadgeVariant(order.status)}>
                    {orderStatusLabels[order.status]}
                  </Badge>
                </td>
                <td className="px-5 py-4">
                  <Price value={order.total_omr} />
                </td>
                <td className="px-5 py-4">
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="inline-flex items-center gap-2 text-xs font-semibold text-oud-brown"
                  >
                    <Eye className="size-4" aria-hidden="true" />
                    التفاصيل
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function getStatusBadgeVariant(status: AdminOrderListItem["status"]) {
  if (status === "completed" || status === "confirmed") {
    return "success";
  }

  if (status === "cancelled") {
    return "danger";
  }

  return "gold";
}

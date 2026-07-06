import Link from "next/link";
import { Eye } from "lucide-react";
import { Badge, Card, EmptyState, Price } from "@/components/ui";
import { orderStatusLabels } from "@/components/admin/order-status-select";
import type { CustomerOrderRow } from "@/features/customers/queries";

type CustomerOrdersTableProps = {
  orders: CustomerOrderRow[];
};

const paymentMethodLabels = {
  cash_on_delivery: "الدفع عند الاستلام",
  bank_transfer: "التحويل البنكي",
  manual_confirmation: "تأكيد يدوي",
  tap_payments: "دفع إلكتروني"
};

export function CustomerOrdersTable({ orders }: CustomerOrdersTableProps) {
  if (orders.length === 0) {
    return (
      <EmptyState
        title="لا توجد طلبات لهذا العميل"
        description="ستظهر طلبات العميل هنا بعد إتمام أول عملية شراء."
      />
    );
  }

  return (
    <Card className="overflow-hidden shadow-none">
      <div className="border-b border-oud-brown/10 p-5">
        <h2 className="font-display text-2xl font-bold text-oud-brown">طلبات العميل</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[44rem] text-right text-sm">
          <thead className="bg-oud-beige/35 text-xs text-oud-muted">
            <tr>
              <th className="px-5 py-3 font-semibold">رقم الطلب</th>
              <th className="px-5 py-3 font-semibold">التاريخ</th>
              <th className="px-5 py-3 font-semibold">طريقة الدفع</th>
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
                <td className="px-5 py-4 text-oud-muted">{formatDate(order.created_at)}</td>
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

function getStatusBadgeVariant(status: CustomerOrderRow["status"]) {
  if (status === "completed" || status === "confirmed") {
    return "success";
  }

  if (status === "cancelled") {
    return "danger";
  }

  return "gold";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ar-OM", {
    dateStyle: "medium"
  }).format(new Date(value));
}

import Link from "next/link";
import { Eye } from "lucide-react";
import { adminRoleLabels } from "@/constants/admin-roles";
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
        title="لا توجد طلبات"
        description="لا توجد طلبات مطابقة للفلاتر الحالية. جرّب توسيع نطاق البحث أو تغيير الحالة."
      />
    );
  }

  return (
    <Card className="overflow-hidden shadow-none">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[68rem] text-right text-sm">
          <thead className="bg-oud-beige/35 text-xs text-oud-muted">
            <tr>
              <th className="px-5 py-3 font-semibold">رقم الطلب</th>
              <th className="px-5 py-3 font-semibold">العميل</th>
              <th className="px-5 py-3 font-semibold">الدفع</th>
              <th className="px-5 py-3 font-semibold">الحالة</th>
              <th className="px-5 py-3 font-semibold">المسؤول</th>
              <th className="px-5 py-3 font-semibold">التنبيهات</th>
              <th className="px-5 py-3 font-semibold">الإجمالي</th>
              <th className="px-5 py-3 font-semibold">التاريخ</th>
              <th className="px-5 py-3 font-semibold">إجراء</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-oud-brown/10">
            {orders.map((order) => (
              <tr key={order.id} className="bg-oud-pearl align-top">
                <td className="px-5 py-4 font-semibold text-oud-brown" dir="ltr">
                  {order.order_number}
                </td>
                <td className="px-5 py-4">
                  <p className="font-semibold text-oud-ink">{order.customer_name_snapshot}</p>
                  <p className="mt-1 text-xs text-oud-muted" dir="ltr">
                    {order.customer_phone_snapshot}
                  </p>
                </td>
                <td className="px-5 py-4 text-oud-muted">{paymentMethodLabels[order.payment_method]}</td>
                <td className="px-5 py-4">
                  <Badge variant={getStatusBadgeVariant(order.status)}>
                    {orderStatusLabels[order.status]}
                  </Badge>
                </td>
                <td className="px-5 py-4">
                  {order.assigned_admin_name ? (
                    <div>
                      <p className="font-semibold text-oud-brown">{order.assigned_admin_name}</p>
                      {order.assigned_admin_role ? (
                        <p className="mt-1 text-xs text-oud-muted">
                          {adminRoleLabels[order.assigned_admin_role]}
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <Badge variant="soft">غير معيّن</Badge>
                  )}
                </td>
                <td className="px-5 py-4">
                  <OrderAlerts order={order} />
                </td>
                <td className="px-5 py-4">
                  <Price value={order.total_omr} />
                </td>
                <td className="px-5 py-4 text-xs text-oud-muted">{formatDate(order.created_at)}</td>
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

function OrderAlerts({ order }: { order: AdminOrderListItem }) {
  const alerts = getOrderAlerts(order);

  if (alerts.length === 0) {
    return <span className="text-xs text-oud-muted">لا توجد</span>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {alerts.map((alert) => (
        <Badge key={alert.label} variant={alert.variant}>
          {alert.label}
        </Badge>
      ))}
    </div>
  );
}

function getOrderAlerts(order: AdminOrderListItem) {
  const ageHours = (Date.now() - new Date(order.created_at).getTime()) / 36e5;
  const alerts: Array<{ label: string; variant: "gold" | "soft" | "danger" }> = [];

  if (!order.assigned_admin_id && order.status !== "completed" && order.status !== "cancelled") {
    alerts.push({ label: "غير معيّن", variant: "soft" });
  }

  if (ageHours >= 24 && order.status !== "completed" && order.status !== "cancelled") {
    alerts.push({ label: "متأخر", variant: "danger" });
  }

  if (ageHours >= 6 && ["pending", "confirmed", "preparing"].includes(order.status)) {
    alerts.push({ label: "يحتاج متابعة", variant: "gold" });
  }

  return alerts;
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

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ar-OM", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

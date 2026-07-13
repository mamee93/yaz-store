import type { Database } from "@/types/database";

export type OrderStatus = Database["public"]["Enums"]["order_status"];

export const orderStatusLabels: Record<OrderStatus, string> = {
  pending: "قيد التأكيد",
  confirmed: "مؤكد",
  preparing: "قيد التجهيز",
  out_for_delivery: "قيد التوصيل",
  completed: "مكتمل",
  cancelled: "ملغي"
};

const orderEventLabels: Record<string, string> = {
  "order.created": "إنشاء الطلب",
  "order.status_changed": "تغيير حالة الطلب",
  "order.confirmed": "تأكيد الطلب",
  "order.preparing": "بدء تجهيز الطلب",
  "order.out_for_delivery": "خروج الطلب للتوصيل",
  "order.completed": "إكمال الطلب",
  "order.cancelled": "إلغاء الطلب",
  "order.updated": "تحديث الطلب",
  "order.assigned": "تعيين مسؤول الطلب",
  "order.unassigned": "إلغاء تعيين مسؤول الطلب",
  "order.note_added": "إضافة ملاحظة داخلية",
  "order.note_updated": "تعديل ملاحظة داخلية",
  "order.note_deleted": "حذف ملاحظة داخلية",
  "order.invoice_printed": "طباعة الفاتورة",
  "order.shipping_label_printed": "طباعة بوليصة الشحن",
  "order.return_requested": "طلب إرجاع",
  "order.return_approved": "اعتماد المرتجع",
  "order.return_rejected": "رفض المرتجع",
  "order.return_received": "استلام المرتجع",
  "order.refunded": "تسجيل استرداد",
  "order.return_closed": "إغلاق المرتجع"
};

export function getOrderEventLabel(eventType: string) {
  return orderEventLabels[eventType] ?? eventType;
}

export function getOrderStatusLabel(status: string | null | undefined) {
  if (!status) {
    return "-";
  }

  return orderStatusLabels[status as OrderStatus] ?? status;
}

export function getStatusEventType(status: OrderStatus) {
  if (status === "confirmed") {
    return "order.confirmed";
  }

  if (status === "preparing") {
    return "order.preparing";
  }

  if (status === "out_for_delivery") {
    return "order.out_for_delivery";
  }

  if (status === "completed") {
    return "order.completed";
  }

  if (status === "cancelled") {
    return "order.cancelled";
  }

  return "order.status_changed";
}

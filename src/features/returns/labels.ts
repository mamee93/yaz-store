import type { Database } from "@/types/database";

export type ReturnStatus = Database["public"]["Tables"]["order_returns"]["Row"]["status"];
export type ReturnType = Database["public"]["Tables"]["order_returns"]["Row"]["return_type"];
export type RefundMethod = NonNullable<
  Database["public"]["Tables"]["order_returns"]["Row"]["refund_method"]
>;

export const RETURN_WINDOW_DAYS = 7;

export const returnStatusLabels: Record<ReturnStatus, string> = {
  requested: "بانتظار المراجعة",
  approved: "معتمد",
  rejected: "مرفوض",
  received: "تم الاستلام",
  refunded: "تم الاسترداد",
  closed: "مغلق"
};

export const returnTypeLabels: Record<ReturnType, string> = {
  full_return: "إرجاع كامل",
  partial_return: "إرجاع جزئي",
  exchange: "استبدال",
  refund_only: "استرداد فقط"
};

export const refundMethodLabels: Record<RefundMethod, string> = {
  cash: "نقدًا",
  bank_transfer: "تحويل بنكي",
  original_payment_method: "طريقة الدفع الأصلية",
  store_credit: "رصيد في المتجر",
  manual: "يدوي"
};

export const returnReasonLabels = [
  "المنتج تالف",
  "المنتج مختلف عن الوصف",
  "وصل منتج خاطئ",
  "تغير الرأي",
  "مشكلة في الجودة",
  "سبب آخر"
];

export const returnEventLabels: Record<string, string> = {
  "order.return_requested": "طلب إرجاع",
  "order.return_approved": "اعتماد المرتجع",
  "order.return_rejected": "رفض المرتجع",
  "order.return_received": "استلام المرتجع",
  "order.refunded": "تسجيل استرداد",
  "refund.delivery_fee_included": "تم تضمين رسوم التوصيل في الاسترداد",
  "order.refund_confirmed_by_customer": "تأكيد استلام الاسترداد",
  "order.return_closed": "إغلاق المرتجع"
};

export function getReturnStatusVariant(status: ReturnStatus) {
  if (status === "refunded") {
    return "success" as const;
  }

  if (status === "rejected") {
    return "danger" as const;
  }

  if (status === "closed") {
    return "soft" as const;
  }

  return "gold" as const;
}

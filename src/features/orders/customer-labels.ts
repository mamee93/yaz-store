import type { Database } from "@/types/database";

export type CustomerOrderStatus = Database["public"]["Enums"]["order_status"];

export const customerOrderStatusLabels: Record<CustomerOrderStatus, string> = {
  pending: "تم استلام الطلب",
  confirmed: "تم تأكيد الطلب",
  preparing: "جار التجهيز",
  out_for_delivery: "قيد التوصيل",
  completed: "تم التسليم",
  cancelled: "ملغي"
};

export const customerPaymentMethodLabels: Record<Database["public"]["Enums"]["payment_method"], string> = {
  cash_on_delivery: "الدفع عند الاستلام",
  bank_transfer: "التحويل البنكي",
  manual_confirmation: "تأكيد يدوي",
  tap_payments: "دفع إلكتروني"
};

export function getCustomerOrderStatusVariant(status: CustomerOrderStatus) {
  if (status === "completed") {
    return "success" as const;
  }

  if (status === "cancelled") {
    return "danger" as const;
  }

  if (status === "confirmed" || status === "preparing" || status === "out_for_delivery") {
    return "gold" as const;
  }

  return "soft" as const;
}

export function isActiveCustomerOrderStatus(status: CustomerOrderStatus) {
  return status === "pending" || status === "confirmed" || status === "preparing" || status === "out_for_delivery";
}

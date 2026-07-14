import { RETURN_WINDOW_DAYS } from "@/features/returns/labels";
import type { Database } from "@/types/database";

export type ReturnableOrder = {
  status: Database["public"]["Enums"]["order_status"];
  completed_at: string | null;
  updated_at?: string | null;
  subtotal_omr: number;
  discount_omr: number;
  total_omr: number;
};

export type ReturnableOrderItem = {
  id: string;
  unit_price_omr: number;
  quantity: number;
  line_total_omr: number;
};

export function getReturnEligibility(order: ReturnableOrder, hasOpenReturn: boolean) {
  if (order.status !== "completed") {
    return {
      eligible: false,
      reason: "يمكن طلب الإرجاع بعد اكتمال الطلب فقط."
    };
  }

  if (hasOpenReturn) {
    return {
      eligible: false,
      reason: "يوجد طلب إرجاع مفتوح لهذا الطلب."
    };
  }

  const completedAt = order.completed_at ?? order.updated_at;

  if (!completedAt) {
    return {
      eligible: false,
      reason: "لا يوجد تاريخ اكتمال محفوظ لهذا الطلب."
    };
  }

  const ageDays = (Date.now() - new Date(completedAt).getTime()) / 86_400_000;

  if (ageDays > RETURN_WINDOW_DAYS) {
    return {
      eligible: false,
      reason: `انتهت مدة الإرجاع (${RETURN_WINDOW_DAYS} أيام من تاريخ اكتمال الطلب).`
    };
  }

  return {
    eligible: true,
    reason: "الطلب مؤهل للإرجاع."
  };
}

export function calculateRefundUnit(order: ReturnableOrder, item: ReturnableOrderItem) {
  const subtotal = Math.max(Number(order.subtotal_omr), 0);
  const discount = Math.max(Number(order.discount_omr), 0);
  const lineTotal = Math.max(Number(item.line_total_omr), 0);

  if (subtotal <= 0 || item.quantity <= 0) {
    return roundOmr(item.unit_price_omr);
  }

  const lineDiscount = Math.min(discount, subtotal) * (lineTotal / subtotal);
  const netLineTotal = Math.max(lineTotal - lineDiscount, 0);
  return roundOmr(netLineTotal / item.quantity);
}

export function calculateReturnLine(order: ReturnableOrder, item: ReturnableOrderItem, quantity: number) {
  const unitRefund = calculateRefundUnit(order, item);
  return {
    unitRefund,
    lineRefund: roundOmr(unitRefund * quantity)
  };
}

export function calculateRefundableAmount({
  productRefundOmr,
  deliveryFeeOmr,
  orderTotalOmr,
  includeDeliveryFee = false
}: {
  productRefundOmr: number;
  deliveryFeeOmr: number;
  orderTotalOmr: number;
  includeDeliveryFee?: boolean;
}) {
  // Product refunds are already net of proportional order discount via calculateRefundUnit.
  const productRefund = roundOmr(Math.max(Number(productRefundOmr), 0));
  const deliveryFeeRefund = includeDeliveryFee
    ? roundOmr(Math.min(Math.max(Number(deliveryFeeOmr), 0), Math.max(Number(orderTotalOmr) - productRefund, 0)))
    : 0;
  const totalRefund = clampRefundTotal(productRefund + deliveryFeeRefund, orderTotalOmr);

  return {
    productRefundOmr: productRefund,
    deliveryFeeRefundOmr: deliveryFeeRefund,
    totalRefundOmr: totalRefund,
    includesDeliveryFee: deliveryFeeRefund > 0
  };
}

export function clampRefundTotal(value: number, orderTotal: number) {
  return roundOmr(Math.min(Math.max(value, 0), Math.max(orderTotal, 0)));
}

export function roundOmr(value: number) {
  return Math.round((Number(value) + Number.EPSILON) * 1000) / 1000;
}

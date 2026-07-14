"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logAdminActivity } from "@/features/admin-audit/log";
import { getCurrentCustomer, requireAdminRole } from "@/features/auth/queries";
import { getCustomerIdsForAccount } from "@/features/customers/queries";
import { notifyInventoryStatusTransition } from "@/features/inventory/notifications";
import {
  createCustomerRefundNotification,
  createReturnRequestedNotification
} from "@/features/notifications/actions";
import {
  calculateRefundableAmount,
  calculateReturnLine,
  clampRefundTotal,
  getReturnEligibility,
  roundOmr
} from "@/features/returns/calculations";
import { getAdminReturnById, getCustomerReturnOrder } from "@/features/returns/queries";
import type {
  RefundMethod,
  ReplacementStatus,
  ReturnedItemCondition,
  ReturnResolutionType,
  ReturnType as OrderReturnType
} from "@/features/returns/labels";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AdminProfile } from "@/features/auth/queries";
import type { Database, Json } from "@/types/database";

type ReceiveOrderReturnResult = {
  result_code: "received" | "already_processed" | "invalid_status" | "not_found";
  order_id: string | null;
  stock_restored_at: string | null;
  message: string;
};

type ReturnInventoryMovementRow = {
  product_id: string;
  stock_before: number;
  stock_after: number;
  products: {
    id: string;
    name_ar: string;
    low_stock_threshold: number;
    track_stock: boolean;
  } | null;
};

const returnTypes: OrderReturnType[] = ["full_return", "partial_return", "exchange", "refund_only"];
const resolutionTypes: ReturnResolutionType[] = [
  "refund",
  "replacement_same_product",
  "wrong_item_correction"
];
const returnedItemConditions: ReturnedItemCondition[] = [
  "sellable",
  "damaged",
  "opened",
  "not_returned"
];
const replacementStatuses: ReplacementStatus[] = ["pending", "approved", "shipped", "delivered"];
const refundMethods: RefundMethod[] = [
  "cash",
  "bank_transfer",
  "original_payment_method",
  "store_credit",
  "manual"
];

export async function requestOrderReturnAction(orderId: string, formData: FormData) {
  const data = await getCustomerReturnOrder(orderId);

  if (!data) {
    redirect("/account?status=error&message=تعذر العثور على الطلب.");
  }

  const eligibility = getReturnEligibility(data.order, Boolean(data.openReturn));

  if (!eligibility.eligible) {
    redirect(`/account/orders/${orderId}?status=error&message=${encodeURIComponent(eligibility.reason)}`);
  }

  const returnType = String(formData.get("return_type") ?? "") as OrderReturnType;
  const reason = String(formData.get("reason") ?? "").trim();
  const customerNote = String(formData.get("customer_note") ?? "").trim();

  if (!returnTypes.includes(returnType) || !reason) {
    redirect(`/account/orders/${orderId}/return?status=error&message=يرجى اختيار نوع الطلب وسبب الإرجاع.`);
  }

  const previousQuantities = await getPreviouslyReturnedQuantities(
    data.order.id,
    data.order.order_items.map((item) => item.id)
  );

  const items = data.order.order_items
    .map((item) => {
      const quantity = Number.parseInt(String(formData.get(`quantity_${item.id}`) ?? "0"), 10);

      if (!Number.isFinite(quantity) || quantity <= 0) {
        return null;
      }

      const remainingQuantity = item.quantity - (previousQuantities.get(item.id) ?? 0);

      if (quantity > remainingQuantity) {
        redirect(`/account/orders/${orderId}/return?status=error&message=لا يمكن اختيار كمية أكبر من الكمية المشتراة.`);
      }

      const calculated = calculateReturnLine(data.order, item, quantity);

      return {
        order_item_id: item.id,
        quantity,
        unit_refund_omr: calculated.unitRefund,
        line_refund_omr: calculated.lineRefund,
        return_to_stock: returnType !== "refund_only"
      };
    })
    .filter(Boolean) as Array<Database["public"]["Tables"]["order_return_items"]["Insert"]>;

  if (items.length === 0) {
    redirect(`/account/orders/${orderId}/return?status=error&message=يرجى اختيار منتج واحد على الأقل.`);
  }

  const total = clampRefundTotal(
    items.reduce((sum, item) => sum + Number(item.line_refund_omr), 0),
    data.order.total_omr
  );

  if (total <= 0) {
    redirect(`/account/orders/${orderId}/return?status=error&message=تعذر حساب مبلغ قابل للاسترداد.`);
  }

  const supabase = createAdminClient();
  const { data: createdReturn, error: returnError } = await supabase
    .from("order_returns")
    .insert({
      order_id: data.order.id,
      customer_id: data.order.customer_id,
      status: "requested",
      return_type: returnType,
      reason,
      customer_note: customerNote || null
    })
    .select("id")
    .single()
    .returns<{ id: string }>();

  if (returnError || !createdReturn) {
    console.error("Failed to create order return", returnError);
    redirect(`/account/orders/${orderId}/return?status=error&message=تعذر إرسال طلب الإرجاع.`);
  }

  const { error: itemsError } = await supabase.from("order_return_items").insert(
    items.map((item) => ({
      ...item,
      return_id: createdReturn.id
    }))
  );

  if (itemsError) {
    console.error("Failed to create order return items", itemsError);
    redirect(`/account/orders/${orderId}/return?status=error&message=تعذر حفظ عناصر الإرجاع.`);
  }

  await logReturnOrderEvent({
    orderId,
    eventType: "order.return_requested",
    title: "طلب إرجاع",
    description: "تم إرسال طلب الإرجاع وسيتم مراجعته.",
    metadata: {
      return_id: createdReturn.id,
      return_type: returnType,
      expected_refund_omr: total
    }
  });

    await notifyNewReturnRequest({
  returnId: createdReturn.id,
  orderId: data.order.id,
  orderNumber: data.order.order_number
});
  await createReturnRequestedNotification({
    returnId: createdReturn.id,
    orderId: data.order.id,
    orderNumber: data.order.order_number
  });

  revalidateReturnPaths(orderId, createdReturn.id);
  redirect(`/account/returns/${createdReturn.id}?status=success&message=تم إرسال طلب الإرجاع وسيتم مراجعته.`);
}

export async function approveReturnAction(returnId: string, formData: FormData) {
  const admin = await requireAdminRole(["owner", "manager"]);

  if (!admin) {
    redirectAdminReturn(returnId, "error", "ليست لديك صلاحية اعتماد المرتجعات.");
  }

  const adminNote = String(formData.get("admin_note") ?? "").trim();
  const detail = await getAdminReturnById(returnId);

  if (!detail) {
    redirectAdminReturn(returnId, "error", "المرتجع غير موجود.");
  }

  if (detail.status !== "requested") {
    redirectAdminReturn(returnId, "error", "تمت معالجة هذا المرتجع مسبقًا.");
  }

  const resolutionType = normalizeResolutionType(formData.get("resolution_type"), detail.return_type);
  const itemDecisions = detail.items.map((item) => {
    const condition = normalizeReturnedItemCondition(formData.get(`condition_${item.id}`));
    const replacementProductId = normalizeNullableUuid(formData.get(`replacement_product_id_${item.id}`));
    const replacementQuantity = normalizeReplacementQuantity(
      formData.get(`replacement_quantity_${item.id}`),
      resolutionType === "refund" ? 0 : item.quantity
    );
    const replacementStatus = normalizeReplacementStatus(formData.get(`replacement_status_${item.id}`));

    if (resolutionType !== "refund" && replacementQuantity > 0 && !replacementProductId) {
      redirectAdminReturn(returnId, "error", "حدد المنتج البديل لكل عنصر استبدال.");
    }

    return {
      item,
      condition,
      replacementProductId,
      replacementQuantity,
      replacementStatus: resolutionType === "refund" ? null : replacementStatus,
      returnToStock: condition === "sellable"
    };
  });

  const now = new Date().toISOString();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("order_returns")
    .update({
      status: "approved",
      resolution_type: resolutionType,
      approved_at: now,
      approved_by_admin_id: admin.id,
      admin_note: adminNote || null
    })
    .eq("id", returnId)
    .eq("status", "requested")
    .select("id,order_id")
    .maybeSingle()
    .returns<{ id: string; order_id: string } | null>();

  if (error || !data) {
    redirectAdminReturn(returnId, "error", "تعذر اعتماد المرتجع أو تمت معالجته مسبقًا.");
  }

  for (const decision of itemDecisions) {
    const replacementStockDeducted = await updateReturnItemResolution({
      admin,
      orderId: data.order_id,
      returnId,
      itemId: decision.item.id,
      condition: decision.condition,
      returnToStock: decision.returnToStock,
      replacementProductId: decision.replacementProductId,
      replacementQuantity: decision.replacementQuantity,
      replacementStatus: decision.replacementStatus,
      shouldDeductReplacementStock: resolutionType !== "refund" && decision.replacementQuantity > 0
    });

    decision.item.replacement_stock_deducted_at = replacementStockDeducted
      ? new Date().toISOString()
      : decision.item.replacement_stock_deducted_at;
  }

  await safeAfterReturnMutation("approveReturnAction.logs", () =>
    writeAdminReturnLogs({
      admin,
      orderId: data.order_id,
      returnId,
      eventType: "order.return_approved",
      auditAction: "return.approve",
      title: "اعتماد المرتجع",
      description: "تم اعتماد طلب الإرجاع.",
      metadata: {
        resolution_type: resolutionType,
        return_reason: detail.reason,
        processed_by: admin.id,
        product_refund_omr: resolutionType === "refund" ? detail.expected_refund_omr : 0,
        delivery_fee_refund_omr: 0,
        total_refund_omr: resolutionType === "refund" ? detail.expected_refund_omr : 0,
        items: itemDecisions.map((decision) => ({
          return_item_id: decision.item.id,
          order_item_id: decision.item.order_item_id,
          returned_item_condition: decision.condition,
          restocked_quantity: decision.returnToStock ? decision.item.quantity : 0,
          replacement_product_id: decision.replacementProductId,
          replacement_quantity: decision.replacementQuantity,
          replacement_stock_deducted: Boolean(decision.item.replacement_stock_deducted_at)
        }))
      }
    })
  );

  revalidateReturnPaths(data.order_id, returnId);
  redirectAdminReturn(returnId, "success", "تم اعتماد المرتجع.");
}

export async function rejectReturnAction(returnId: string, formData: FormData) {
  const admin = await requireAdminRole(["owner", "manager"]);

  if (!admin) {
    redirectAdminReturn(returnId, "error", "ليست لديك صلاحية رفض المرتجعات.");
  }

  const reason = String(formData.get("admin_note") ?? "").trim();

  if (!reason) {
    redirectAdminReturn(returnId, "error", "سبب الرفض مطلوب.");
  }

  const now = new Date().toISOString();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("order_returns")
    .update({
      status: "rejected",
      rejected_at: now,
      rejected_by_admin_id: admin.id,
      admin_note: reason
    })
    .eq("id", returnId)
    .eq("status", "requested")
    .select("id,order_id")
    .maybeSingle()
    .returns<{ id: string; order_id: string } | null>();

  if (error || !data) {
    redirectAdminReturn(returnId, "error", "تعذر رفض المرتجع أو تمت معالجته مسبقًا.");
  }

  await writeAdminReturnLogs({
    admin,
    orderId: data.order_id,
    returnId,
    eventType: "order.return_rejected",
    auditAction: "return.reject",
    title: "رفض المرتجع",
    description: "تم رفض طلب الإرجاع.",
    metadata: { reason }
  });

  revalidateReturnPaths(data.order_id, returnId);
  redirectAdminReturn(returnId, "success", "تم رفض المرتجع.");
}

export async function receiveReturnAction(returnId: string) {
  const admin = await requireAdminRole(["owner", "manager", "cashier"]);

  if (!admin) {
    redirectAdminReturn(returnId, "error", "ليست لديك صلاحية تسجيل استلام المرتجع.");
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .rpc("receive_order_return", {
      p_return_id: returnId,
      p_admin_id: admin.id
    })
    .returns<ReceiveOrderReturnResult[]>();

  if (error) {
    console.error("receive_order_return RPC failed", error);
    redirectAdminReturn(returnId, "error", "تعذر تسجيل استلام المرتجع.");
  }

  const result = data?.[0];

  if (!result) {
    redirectAdminReturn(returnId, "error", "تعذر تسجيل استلام المرتجع.");
  }

  if (result.result_code === "not_found") {
    redirectAdminReturn(returnId, "error", "المرتجع غير موجود.");
  }

  if (result.result_code === "invalid_status") {
    redirectAdminReturn(returnId, "error", "لا يمكن تسجيل الاستلام لهذه الحالة.");
  }

  if (result.result_code === "already_processed") {
    if (result.order_id) {
      revalidateReturnPaths(result.order_id, returnId);
    }

    redirectAdminReturn(returnId, "success", "تمت معالجة استلام المرتجع مسبقًا.");
  }

  if (result.result_code !== "received" || !result.order_id) {
    redirectAdminReturn(returnId, "error", "تعذر تسجيل استلام المرتجع.");
  }

  const receivedOrderId = result.order_id;
  await safeAfterReturnMutation("receiveReturnAction.logs", () =>
    writeAdminReturnLogs({
      admin,
      orderId: receivedOrderId,
      returnId,
      eventType: "order.return_received",
      auditAction: "return.receive",
      title: "استلام المرتجع",
      description: "تم تسجيل استلام المنتجات المرتجعة."
    })
  );

  await safeAfterReturnMutation("receiveReturnAction.inventoryNotifications", () =>
    notifyReturnStockMovements(returnId)
  );

  revalidateReturnPaths(receivedOrderId, returnId);
  redirectAdminReturn(returnId, "success", "تم تسجيل استلام المرتجع.");
}
export async function refundReturnAction(returnId: string, formData: FormData) {
  const admin = await requireAdminRole(["owner", "manager"]);

  if (!admin) {
    redirectAdminReturn(returnId, "error", "ليست لديك صلاحية تنفيذ الاسترداد.");
  }

  const detail = await getAdminReturnById(returnId);

  if (!detail) {
    redirectAdminReturn(returnId, "error", "المرتجع غير موجود.");
  }

  const canRefund =
    detail.status === "received" || (detail.status === "approved" && detail.return_type === "refund_only");

  if (!canRefund) {
    redirectAdminReturn(returnId, "error", "لا يمكن تنفيذ الاسترداد قبل الاعتماد والاستلام.");
  }

  const refundMethod = String(formData.get("refund_method") ?? "") as RefundMethod;
  const requestedAmount = Number(String(formData.get("refund_amount_omr") ?? "0"));
  const refundReference = String(formData.get("refund_reference") ?? "").trim();
  const adminNote = String(formData.get("admin_note") ?? "").trim();
  const includeDeliveryFee = formData.get("include_delivery_fee_in_refund") === "on";

  if (!refundMethods.includes(refundMethod)) {
    redirectAdminReturn(returnId, "error", "يرجى اختيار طريقة الاسترداد.");
  }

  const productRefundSummary = calculateRefundableAmount({
    productRefundOmr: detail.expected_refund_omr,
    deliveryFeeOmr: detail.order.delivery_fee_omr,
    orderTotalOmr: detail.order.total_omr
  });
  const maxRefundSummary = calculateRefundableAmount({
    productRefundOmr: detail.expected_refund_omr,
    deliveryFeeOmr: detail.order.delivery_fee_omr,
    orderTotalOmr: detail.order.total_omr,
    includeDeliveryFee
  });
  const maxRefund = maxRefundSummary.totalRefundOmr;
  const refundAmount = roundOmr(requestedAmount);
  const productRefundPortion = roundOmr(Math.min(refundAmount, productRefundSummary.productRefundOmr));
  const deliveryFeeRefundPortion = roundOmr(Math.max(refundAmount - productRefundPortion, 0));

  if (!Number.isFinite(refundAmount) || refundAmount <= 0 || refundAmount > maxRefund) {
    redirectAdminReturn(returnId, "error", "مبلغ الاسترداد غير صالح أو يتجاوز المبلغ المسموح.");
  }

  if (deliveryFeeRefundPortion > 0 && !includeDeliveryFee) {
    redirectAdminReturn(returnId, "error", "رسوم التوصيل لا تضاف إلى الاسترداد إلا بموافقة الإدارة.");
  }

  const now = new Date().toISOString();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("order_returns")
    .update({
      status: "refunded",
      refunded_at: now,
      refunded_by_admin_id: admin.id,
      refund_method: refundMethod,
      refund_amount_omr: refundAmount,
      product_refund_omr: productRefundPortion,
      delivery_fee_refund_omr: deliveryFeeRefundPortion,
      refund_reference: refundReference || null,
      admin_note: adminNote || detail.admin_note
    })
    .eq("id", returnId)
    .in("status", detail.return_type === "refund_only" ? ["approved", "received"] : ["received"])
    .select("id,order_id")
    .maybeSingle()
    .returns<{ id: string; order_id: string } | null>();

  if (error || !data) {
    redirectAdminReturn(returnId, "error", "تعذر تسجيل الاسترداد أو تم تنفيذه مسبقًا.");
  }

  await safeAfterReturnMutation("refundReturnAction.logs", () =>
    writeAdminReturnLogs({
      admin,
      orderId: data.order_id,
      returnId,
      eventType: "order.refunded",
      auditAction: "refund.create",
      title: "تسجيل استرداد",
      description: "تم تسجيل استرداد يدوي للمرتجع.",
      metadata: {
        resolution_type: detail.resolution_type ?? "refund",
        return_reason: detail.reason,
        processed_by: admin.id,
        refund_method: refundMethod,
        product_refund_omr: productRefundPortion,
        delivery_fee_refund_omr: deliveryFeeRefundPortion,
        total_refund_omr: refundAmount,
        refund_amount_omr: refundAmount,
        include_delivery_fee_in_refund: deliveryFeeRefundPortion > 0,
        delivery_fee_refund_reason: deliveryFeeRefundPortion > 0 ? "management_exception" : null
      }
    })
  );

  if (deliveryFeeRefundPortion > 0) {
    const deliveryFeeMetadata = {
      return_id: returnId,
      order_id: data.order_id,
      product_refund_omr: productRefundPortion,
      delivery_fee_refund_omr: deliveryFeeRefundPortion,
      total_refund_omr: refundAmount,
      delivery_fee_refund_reason: "management_exception"
    };

    await safeAfterReturnMutation("refundReturnAction.deliveryFeeLogs", async () => {
      await logReturnOrderEvent({
        orderId: data.order_id,
        admin,
        eventType: "refund.delivery_fee_included",
        title: "تم تضمين رسوم التوصيل في الاسترداد",
        description: "تم تضمين رسوم التوصيل في الاسترداد بقرار من إدارة المتجر.",
        metadata: deliveryFeeMetadata
      });

      await logAdminActivity({
        admin,
        action: "refund.delivery_fee_included",
        entityType: "order_return",
        entityId: returnId,
        description: "تم تضمين رسوم التوصيل في الاسترداد",
        metadata: deliveryFeeMetadata
      });
    });
  }

  await safeAfterReturnMutation("refundReturnAction.customerNotification", () =>
    createCustomerRefundNotification({
      customerId: detail.customer_id,
      returnId,
      orderId: data.order_id,
      orderNumber: detail.order.order_number,
      amount: refundAmount
    })
  );

  revalidateReturnPaths(data.order_id, returnId);
  redirectAdminReturn(returnId, "success", "تم تسجيل الاسترداد اليدوي.");
}

export async function confirmRefundReceivedAction(returnId: string) {
  const customer = await getCurrentCustomer();

  if (!customer) {
    redirect("/login");
  }

  const customerIds = await getCustomerIdsForAccount({
    id: customer.id,
    email: customer.email
  });

  if (customerIds.length === 0) {
    redirect(`/account/returns/${returnId}?status=error&message=تعذر تأكيد الاسترداد.`);
  }

  const now = new Date().toISOString();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("order_returns")
    .update({ customer_refund_confirmed_at: now } as never)
    .eq("id", returnId)
    .in("customer_id", customerIds)
    .eq("status", "refunded")
    .is("customer_refund_confirmed_at", null)
    .select("id,order_id")
    .maybeSingle()
    .returns<{ id: string; order_id: string } | null>();

  if (error || !data) {
    redirect(`/account/returns/${returnId}?status=error&message=تعذر تأكيد الاسترداد أو تم تأكيده مسبقًا.`);
  }

  await logReturnOrderEvent({
    orderId: data.order_id,
    eventType: "order.refund_confirmed_by_customer",
    title: "تأكيد استلام الاسترداد",
    description: "تم تأكيد استلام مبلغ الاسترداد من العميل.",
    metadata: {
      return_id: returnId,
      customer_refund_confirmed_at: now
    }
  });

  revalidateReturnPaths(data.order_id, returnId);
  redirect(`/account/returns/${returnId}?status=success&message=تم تأكيد استلام المبلغ`);
}

export async function closeReturnAction(returnId: string, formData: FormData) {
  const admin = await requireAdminRole(["owner", "manager"]);

  if (!admin) {
    redirectAdminReturn(returnId, "error", "ليست لديك صلاحية إغلاق المرتجعات.");
  }

  const adminNote = String(formData.get("admin_note") ?? "").trim();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("order_returns")
    .update({
      status: "closed",
      admin_note: adminNote || null
    })
    .eq("id", returnId)
    .eq("status", "received")
    .select("id,order_id")
    .maybeSingle()
    .returns<{ id: string; order_id: string } | null>();

  if (error || !data) {
    redirectAdminReturn(returnId, "error", "تعذر إغلاق المرتجع.");
  }

  await safeAfterReturnMutation("closeReturnAction.logs", () =>
    writeAdminReturnLogs({
      admin,
      orderId: data.order_id,
      returnId,
      eventType: "order.return_closed",
      auditAction: "return.close",
      title: "إغلاق المرتجع",
      description: "تم إغلاق المرتجع دون استرداد إضافي."
    })
  );

  revalidateReturnPaths(data.order_id, returnId);
  redirectAdminReturn(returnId, "success", "تم إغلاق المرتجع.");
}

async function updateReturnItemResolution({
  admin,
  orderId,
  returnId,
  itemId,
  condition,
  returnToStock,
  replacementProductId,
  replacementQuantity,
  replacementStatus,
  shouldDeductReplacementStock
}: {
  admin: AdminProfile;
  orderId: string;
  returnId: string;
  itemId: string;
  condition: ReturnedItemCondition;
  returnToStock: boolean;
  replacementProductId: string | null;
  replacementQuantity: number;
  replacementStatus: ReplacementStatus | null;
  shouldDeductReplacementStock: boolean;
}) {
  const supabase = createAdminClient();
  let replacementStockDeducted = false;

  if (shouldDeductReplacementStock && replacementProductId && replacementQuantity > 0) {
    const { data: existingItem, error: itemLookupError } = await supabase
      .from("order_return_items")
      .select("id,replacement_stock_deducted_at")
      .eq("id", itemId)
      .eq("return_id", returnId)
      .maybeSingle()
      .returns<Pick<Database["public"]["Tables"]["order_return_items"]["Row"], "id" | "replacement_stock_deducted_at"> | null>();

    if (itemLookupError || !existingItem) {
      console.error("Failed to read replacement return item", itemLookupError);
      redirectAdminReturn(returnId, "error", "تعذر قراءة عنصر الاستبدال.");
    }

    if (!existingItem.replacement_stock_deducted_at) {
      await deductReplacementStock({
        admin,
        orderId,
        returnId,
        productId: replacementProductId,
        quantity: replacementQuantity
      });
      replacementStockDeducted = true;
    }
  }

  const { error } = await supabase
    .from("order_return_items")
    .update({
      returned_item_condition: condition,
      return_to_stock: returnToStock,
      replacement_product_id: replacementProductId,
      replacement_quantity: replacementQuantity,
      replacement_status: replacementStatus,
      replacement_stock_deducted_at: replacementStockDeducted ? new Date().toISOString() : undefined,
      replacement_stock_deducted_by_admin_id: replacementStockDeducted ? admin.id : undefined
    } as Database["public"]["Tables"]["order_return_items"]["Update"] as never)
    .eq("id", itemId)
    .eq("return_id", returnId);

  if (error) {
    console.error("Failed to update return item resolution", error);
    redirectAdminReturn(returnId, "error", "تعذر حفظ معالجة عنصر المرتجع.");
  }

  return replacementStockDeducted;
}

async function deductReplacementStock({
  admin,
  orderId,
  returnId,
  productId,
  quantity
}: {
  admin: AdminProfile;
  orderId: string;
  returnId: string;
  productId: string;
  quantity: number;
}) {
  const supabase = createAdminClient();
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id,stock_quantity,track_stock")
    .eq("id", productId)
    .maybeSingle()
    .returns<Pick<Database["public"]["Tables"]["products"]["Row"], "id" | "stock_quantity" | "track_stock"> | null>();

  if (productError || !product) {
    console.error("Failed to read replacement product", productError);
    redirectAdminReturn(returnId, "error", "تعذر قراءة المنتج البديل.");
  }

  if (!product.track_stock) {
    return;
  }

  if (product.stock_quantity < quantity) {
    redirectAdminReturn(returnId, "error", "مخزون المنتج البديل غير كاف.");
  }

  const stockBefore = product.stock_quantity;
  const stockAfter = stockBefore - quantity;
  const { error: stockError } = await supabase
    .from("products")
    .update({ stock_quantity: stockAfter } as never)
    .eq("id", productId);

  if (stockError) {
    console.error("Failed to deduct replacement stock", stockError);
    redirectAdminReturn(returnId, "error", "تعذر خصم مخزون المنتج البديل.");
  }

  const { error: movementError } = await supabase.from("inventory_movements").insert({
    product_id: productId,
    order_id: orderId,
    return_id: returnId,
    admin_id: admin.id,
    movement_type: "adjustment",
    quantity_change: -quantity,
    stock_before: stockBefore,
    stock_after: stockAfter,
    reason: "إرسال منتج بديل",
    notes: `خصم منتج بديل للمرتجع ${returnId}`
  } as Database["public"]["Tables"]["inventory_movements"]["Insert"] as never);

  if (movementError) {
    console.error("Failed to write replacement inventory movement", movementError);
  }
}

async function safeAfterReturnMutation(label: string, callback: () => Promise<void>) {
  try {
    await callback();
  } catch (error) {
    console.error(label, error);
  }
}

function normalizeResolutionType(value: FormDataEntryValue | null, returnType: OrderReturnType): ReturnResolutionType {
  const normalized = String(value ?? "");

  if (resolutionTypes.includes(normalized as ReturnResolutionType)) {
    return normalized as ReturnResolutionType;
  }

  return returnType === "exchange" ? "replacement_same_product" : "refund";
}

function normalizeReturnedItemCondition(value: FormDataEntryValue | null): ReturnedItemCondition {
  const normalized = String(value ?? "");
  return returnedItemConditions.includes(normalized as ReturnedItemCondition)
    ? (normalized as ReturnedItemCondition)
    : "sellable";
}

function normalizeReplacementStatus(value: FormDataEntryValue | null): ReplacementStatus {
  const normalized = String(value ?? "");
  return replacementStatuses.includes(normalized as ReplacementStatus)
    ? (normalized as ReplacementStatus)
    : "pending";
}

function normalizeReplacementQuantity(value: FormDataEntryValue | null, fallback: number) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function normalizeNullableUuid(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "").trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(normalized)
    ? normalized
    : null;
}

async function writeAdminReturnLogs({
  admin,
  orderId,
  returnId,
  eventType,
  auditAction,
  title,
  description,
  metadata = {}
}: {
  admin: AdminProfile;
  orderId: string;
  returnId: string;
  eventType: string;
  auditAction: string;
  title: string;
  description: string;
  metadata?: Json;
}) {
  await logReturnOrderEvent({
    orderId,
    admin,
    eventType,
    title,
    description,
    metadata: {
      ...(typeof metadata === "object" && metadata && !Array.isArray(metadata) ? metadata : {}),
      return_id: returnId
    }
  });

  await logAdminActivity({
    admin,
    action: auditAction,
    entityType: "order_return",
    entityId: returnId,
    description,
    metadata: {
      ...(typeof metadata === "object" && metadata && !Array.isArray(metadata) ? metadata : {}),
      order_id: orderId
    }
  });
}

async function logReturnOrderEvent({
  orderId,
  admin = null,
  eventType,
  title,
  description,
  metadata = {}
}: {
  orderId: string;
  admin?: AdminProfile | null;
  eventType: string;
  title: string;
  description: string;
  metadata?: Json;
}) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("order_events").insert({
    order_id: orderId,
    admin_id: admin?.id ?? null,
    auth_user_id: admin?.auth_user_id ?? null,
    event_type: eventType,
    title,
    description,
    metadata
  });

  if (error) {
    console.error("Failed to write return order event", error);
  }
}

function revalidateReturnPaths(orderId: string, returnId: string) {
  revalidatePath("/account");
  revalidatePath(`/account/orders/${orderId}`);
  revalidatePath(`/account/returns/${returnId}`);
  revalidatePath("/admin/returns");
  revalidatePath(`/admin/returns/${returnId}`);
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/inventory");
  revalidatePath("/admin/activity");
}

function redirectAdminReturn(returnId: string, status: "success" | "error", message: string): never {
  redirect(`/admin/returns/${returnId}?${new URLSearchParams({ status, message }).toString()}`);
}

async function notifyReturnStockMovements(returnId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("inventory_movements")
    .select("product_id,stock_before,stock_after,products(id,name_ar,low_stock_threshold,track_stock)")
    .eq("return_id", returnId)
    .eq("movement_type", "return_in")
    .returns<ReturnInventoryMovementRow[]>();

  if (error) {
    console.error("Failed to read return inventory movements", error);
    return;
  }

  for (const movement of data ?? []) {
    if (!movement.products) {
      continue;
    }

    await notifyInventoryStatusTransition({
      before: {
        id: movement.products.id,
        name_ar: movement.products.name_ar,
        stock_quantity: movement.stock_before,
        low_stock_threshold: movement.products.low_stock_threshold,
        track_stock: movement.products.track_stock
      },
      after: {
        id: movement.products.id,
        name_ar: movement.products.name_ar,
        stock_quantity: movement.stock_after,
        low_stock_threshold: movement.products.low_stock_threshold,
        track_stock: movement.products.track_stock
      }
    });
  }
}

async function getPreviouslyReturnedQuantities(orderId: string, orderItemIds: string[]) {
  if (orderItemIds.length === 0) {
    return new Map<string, number>();
  }

  const supabase = createAdminClient();
  const { data: returns, error: returnsError } = await supabase
    .from("order_returns")
    .select("id")
    .eq("order_id", orderId)
    .neq("status", "rejected")
    .returns<Array<{ id: string }>>();

  if (returnsError) {
    throw returnsError;
  }

  const returnIds = (returns ?? []).map((item) => item.id);

  if (returnIds.length === 0) {
    return new Map<string, number>();
  }

  const { data: items, error: itemsError } = await supabase
    .from("order_return_items")
    .select("order_item_id,quantity")
    .in("return_id", returnIds)
    .in("order_item_id", orderItemIds)
    .returns<Array<{ order_item_id: string; quantity: number }>>();

  if (itemsError) {
    throw itemsError;
  }

  return (items ?? []).reduce((totals, item) => {
    totals.set(item.order_item_id, (totals.get(item.order_item_id) ?? 0) + item.quantity);
    return totals;
  }, new Map<string, number>());
}

async function notifyNewReturnRequest({
  returnId,
  orderId,
  orderNumber
}: {
  returnId: string;
  orderId: string;
  orderNumber: string;
}) {
  try {
    const supabase = createAdminClient();

    const { data: existingNotification, error: lookupError } = await supabase
      .from("notifications")
      .select("id")
      .eq("type", "return.requested")
      .eq("entity_type", "order_return")
      .eq("entity_id", returnId)
      .eq("is_read", false)
      .limit(1)
      .maybeSingle()
      .returns<{ id: string } | null>();

    if (lookupError) {
      console.error("Failed to check return notification", lookupError);
      return;
    }

    if (existingNotification) {
      return;
    }

    const { error: insertError } = await supabase
      .from("notifications")
      .insert({
        type: "return.requested",
        title: "طلب إرجاع جديد",
        message: `تم استلام طلب إرجاع للطلب رقم ${orderNumber}.`,
        entity_type: "order_return",
        entity_id: returnId,
        is_read: false
      });

    if (insertError) {
      console.error("Failed to create return notification", insertError);
    }
  } catch (error) {
    console.error("notifyNewReturnRequest failed", error);
  }
}

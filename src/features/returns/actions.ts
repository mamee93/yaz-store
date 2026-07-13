"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logAdminActivity } from "@/features/admin-audit/log";
import { requireAdminRole } from "@/features/auth/queries";
import {
  calculateReturnLine,
  clampRefundTotal,
  getReturnEligibility,
  roundOmr
} from "@/features/returns/calculations";
import { getAdminReturnById, getCustomerReturnOrder } from "@/features/returns/queries";
import type { RefundMethod, ReturnType as OrderReturnType } from "@/features/returns/labels";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AdminProfile } from "@/features/auth/queries";
import type { Database, Json } from "@/types/database";

type ReceiveOrderReturnResult = {
  result_code: "received" | "already_processed" | "invalid_status" | "not_found";
  order_id: string | null;
  stock_restored_at: string | null;
  message: string;
};

const returnTypes: OrderReturnType[] = ["full_return", "partial_return", "exchange", "refund_only"];
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
    redirect("/account?status=error&message=ØªØ¹Ø°Ø± Ø§Ù„Ø¹Ø«ÙˆØ± Ø¹Ù„Ù‰ Ø§Ù„Ø·Ù„Ø¨.");
  }

  const eligibility = getReturnEligibility(data.order, Boolean(data.openReturn));

  if (!eligibility.eligible) {
    redirect(`/account/orders/${orderId}?status=error&message=${encodeURIComponent(eligibility.reason)}`);
  }

  const returnType = String(formData.get("return_type") ?? "") as OrderReturnType;
  const reason = String(formData.get("reason") ?? "").trim();
  const customerNote = String(formData.get("customer_note") ?? "").trim();

  if (!returnTypes.includes(returnType) || !reason) {
    redirect(`/account/orders/${orderId}/return?status=error&message=ÙŠØ±Ø¬Ù‰ Ø§Ø®ØªÙŠØ§Ø± Ù†ÙˆØ¹ Ø§Ù„Ø·Ù„Ø¨ ÙˆØ³Ø¨Ø¨ Ø§Ù„Ø¥Ø±Ø¬Ø§Ø¹.`);
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
        redirect(`/account/orders/${orderId}/return?status=error&message=Ù„Ø§ ÙŠÙ…ÙƒÙ† Ø§Ø®ØªÙŠØ§Ø± ÙƒÙ…ÙŠØ© Ø£ÙƒØ¨Ø± Ù…Ù† Ø§Ù„ÙƒÙ…ÙŠØ© Ø§Ù„Ù…Ø´ØªØ±Ø§Ø©.`);
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
    redirect(`/account/orders/${orderId}/return?status=error&message=ÙŠØ±Ø¬Ù‰ Ø§Ø®ØªÙŠØ§Ø± Ù…Ù†ØªØ¬ ÙˆØ§Ø­Ø¯ Ø¹Ù„Ù‰ Ø§Ù„Ø£Ù‚Ù„.`);
  }

  const total = clampRefundTotal(
    items.reduce((sum, item) => sum + Number(item.line_refund_omr), 0),
    data.order.total_omr
  );

  if (total <= 0) {
    redirect(`/account/orders/${orderId}/return?status=error&message=ØªØ¹Ø°Ø± Ø­Ø³Ø§Ø¨ Ù…Ø¨Ù„Øº Ù‚Ø§Ø¨Ù„ Ù„Ù„Ø§Ø³ØªØ±Ø¯Ø§Ø¯.`);
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
    redirect(`/account/orders/${orderId}/return?status=error&message=ØªØ¹Ø°Ø± Ø¥Ø±Ø³Ø§Ù„ Ø·Ù„Ø¨ Ø§Ù„Ø¥Ø±Ø¬Ø§Ø¹.`);
  }

  const { error: itemsError } = await supabase.from("order_return_items").insert(
    items.map((item) => ({
      ...item,
      return_id: createdReturn.id
    }))
  );

  if (itemsError) {
    console.error("Failed to create order return items", itemsError);
    redirect(`/account/orders/${orderId}/return?status=error&message=ØªØ¹Ø°Ø± Ø­ÙØ¸ Ø¹Ù†Ø§ØµØ± Ø§Ù„Ø¥Ø±Ø¬Ø§Ø¹.`);
  }

  await logReturnOrderEvent({
    orderId,
    eventType: "order.return_requested",
    title: "Ø·Ù„Ø¨ Ø¥Ø±Ø¬Ø§Ø¹",
    description: "ØªÙ… Ø¥Ø±Ø³Ø§Ù„ Ø·Ù„Ø¨ Ø§Ù„Ø¥Ø±Ø¬Ø§Ø¹ ÙˆØ³ÙŠØªÙ… Ù…Ø±Ø§Ø¬Ø¹ØªÙ‡.",
    metadata: {
      return_id: createdReturn.id,
      return_type: returnType,
      expected_refund_omr: total
    }
  });

  revalidateReturnPaths(orderId, createdReturn.id);
  redirect(`/account/returns/${createdReturn.id}?status=success&message=ØªÙ… Ø¥Ø±Ø³Ø§Ù„ Ø·Ù„Ø¨ Ø§Ù„Ø¥Ø±Ø¬Ø§Ø¹ ÙˆØ³ÙŠØªÙ… Ù…Ø±Ø§Ø¬Ø¹ØªÙ‡.`);
}

export async function approveReturnAction(returnId: string, formData: FormData) {
  const admin = await requireAdminRole(["owner", "manager"]);

  if (!admin) {
    redirectAdminReturn(returnId, "error", "Ù„ÙŠØ³Øª Ù„Ø¯ÙŠÙƒ ØµÙ„Ø§Ø­ÙŠØ© Ø§Ø¹ØªÙ…Ø§Ø¯ Ø§Ù„Ù…Ø±ØªØ¬Ø¹Ø§Øª.");
  }

  const adminNote = String(formData.get("admin_note") ?? "").trim();
  const now = new Date().toISOString();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("order_returns")
    .update({
      status: "approved",
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
    redirectAdminReturn(returnId, "error", "ØªØ¹Ø°Ø± Ø§Ø¹ØªÙ…Ø§Ø¯ Ø§Ù„Ù…Ø±ØªØ¬Ø¹ Ø£Ùˆ ØªÙ…Øª Ù…Ø¹Ø§Ù„Ø¬ØªÙ‡ Ù…Ø³Ø¨Ù‚Ù‹Ø§.");
  }

  await writeAdminReturnLogs({
    admin,
    orderId: data.order_id,
    returnId,
    eventType: "order.return_approved",
    auditAction: "return.approve",
    title: "Ø§Ø¹ØªÙ…Ø§Ø¯ Ø§Ù„Ù…Ø±ØªØ¬Ø¹",
    description: "ØªÙ… Ø§Ø¹ØªÙ…Ø§Ø¯ Ø·Ù„Ø¨ Ø§Ù„Ø¥Ø±Ø¬Ø§Ø¹."
  });

  revalidateReturnPaths(data.order_id, returnId);
  redirectAdminReturn(returnId, "success", "ØªÙ… Ø§Ø¹ØªÙ…Ø§Ø¯ Ø§Ù„Ù…Ø±ØªØ¬Ø¹.");
}

export async function rejectReturnAction(returnId: string, formData: FormData) {
  const admin = await requireAdminRole(["owner", "manager"]);

  if (!admin) {
    redirectAdminReturn(returnId, "error", "Ù„ÙŠØ³Øª Ù„Ø¯ÙŠÙƒ ØµÙ„Ø§Ø­ÙŠØ© Ø±ÙØ¶ Ø§Ù„Ù…Ø±ØªØ¬Ø¹Ø§Øª.");
  }

  const reason = String(formData.get("admin_note") ?? "").trim();

  if (!reason) {
    redirectAdminReturn(returnId, "error", "Ø³Ø¨Ø¨ Ø§Ù„Ø±ÙØ¶ Ù…Ø·Ù„ÙˆØ¨.");
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
    redirectAdminReturn(returnId, "error", "ØªØ¹Ø°Ø± Ø±ÙØ¶ Ø§Ù„Ù…Ø±ØªØ¬Ø¹ Ø£Ùˆ ØªÙ…Øª Ù…Ø¹Ø§Ù„Ø¬ØªÙ‡ Ù…Ø³Ø¨Ù‚Ù‹Ø§.");
  }

  await writeAdminReturnLogs({
    admin,
    orderId: data.order_id,
    returnId,
    eventType: "order.return_rejected",
    auditAction: "return.reject",
    title: "Ø±ÙØ¶ Ø§Ù„Ù…Ø±ØªØ¬Ø¹",
    description: "ØªÙ… Ø±ÙØ¶ Ø·Ù„Ø¨ Ø§Ù„Ø¥Ø±Ø¬Ø§Ø¹.",
    metadata: { reason }
  });

  revalidateReturnPaths(data.order_id, returnId);
  redirectAdminReturn(returnId, "success", "ØªÙ… Ø±ÙØ¶ Ø§Ù„Ù…Ø±ØªØ¬Ø¹.");
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

  await writeAdminReturnLogs({
    admin,
    orderId: result.order_id,
    returnId,
    eventType: "order.return_received",
    auditAction: "return.receive",
    title: "استلام المرتجع",
    description: "تم تسجيل استلام المنتجات المرتجعة."
  });

  revalidateReturnPaths(result.order_id, returnId);
  redirectAdminReturn(returnId, "success", "تم تسجيل استلام المرتجع.");
}
export async function refundReturnAction(returnId: string, formData: FormData) {
  const admin = await requireAdminRole(["owner", "manager"]);

  if (!admin) {
    redirectAdminReturn(returnId, "error", "Ù„ÙŠØ³Øª Ù„Ø¯ÙŠÙƒ ØµÙ„Ø§Ø­ÙŠØ© ØªÙ†ÙÙŠØ° Ø§Ù„Ø§Ø³ØªØ±Ø¯Ø§Ø¯.");
  }

  const detail = await getAdminReturnById(returnId);

  if (!detail) {
    redirectAdminReturn(returnId, "error", "Ø§Ù„Ù…Ø±ØªØ¬Ø¹ ØºÙŠØ± Ù…ÙˆØ¬ÙˆØ¯.");
  }

  const canRefund =
    detail.status === "received" || (detail.status === "approved" && detail.return_type === "refund_only");

  if (!canRefund) {
    redirectAdminReturn(returnId, "error", "Ù„Ø§ ÙŠÙ…ÙƒÙ† ØªÙ†ÙÙŠØ° Ø§Ù„Ø§Ø³ØªØ±Ø¯Ø§Ø¯ Ù‚Ø¨Ù„ Ø§Ù„Ø§Ø¹ØªÙ…Ø§Ø¯ ÙˆØ§Ù„Ø§Ø³ØªÙ„Ø§Ù….");
  }

  const refundMethod = String(formData.get("refund_method") ?? "") as RefundMethod;
  const requestedAmount = Number(String(formData.get("refund_amount_omr") ?? "0"));
  const refundReference = String(formData.get("refund_reference") ?? "").trim();
  const adminNote = String(formData.get("admin_note") ?? "").trim();

  if (!refundMethods.includes(refundMethod)) {
    redirectAdminReturn(returnId, "error", "ÙŠØ±Ø¬Ù‰ Ø§Ø®ØªÙŠØ§Ø± Ø·Ø±ÙŠÙ‚Ø© Ø§Ù„Ø§Ø³ØªØ±Ø¯Ø§Ø¯.");
  }

  const maxRefund = clampRefundTotal(detail.expected_refund_omr, detail.order.total_omr);
  const refundAmount = roundOmr(requestedAmount);

  if (!Number.isFinite(refundAmount) || refundAmount <= 0 || refundAmount > maxRefund) {
    redirectAdminReturn(returnId, "error", "Ù…Ø¨Ù„Øº Ø§Ù„Ø§Ø³ØªØ±Ø¯Ø§Ø¯ ØºÙŠØ± ØµØ§Ù„Ø­ Ø£Ùˆ ÙŠØªØ¬Ø§ÙˆØ² Ø§Ù„Ù…Ø¨Ù„Øº Ø§Ù„Ù…Ø³Ù…ÙˆØ­.");
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
      refund_reference: refundReference || null,
      admin_note: adminNote || detail.admin_note
    })
    .eq("id", returnId)
    .in("status", detail.return_type === "refund_only" ? ["approved", "received"] : ["received"])
    .select("id,order_id")
    .maybeSingle()
    .returns<{ id: string; order_id: string } | null>();

  if (error || !data) {
    redirectAdminReturn(returnId, "error", "ØªØ¹Ø°Ø± ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø§Ø³ØªØ±Ø¯Ø§Ø¯ Ø£Ùˆ ØªÙ… ØªÙ†ÙÙŠØ°Ù‡ Ù…Ø³Ø¨Ù‚Ù‹Ø§.");
  }

  await writeAdminReturnLogs({
    admin,
    orderId: data.order_id,
    returnId,
    eventType: "order.refunded",
    auditAction: "refund.create",
    title: "ØªØ³Ø¬ÙŠÙ„ Ø§Ø³ØªØ±Ø¯Ø§Ø¯",
    description: "ØªÙ… ØªØ³Ø¬ÙŠÙ„ Ø§Ø³ØªØ±Ø¯Ø§Ø¯ ÙŠØ¯ÙˆÙŠ Ù„Ù„Ù…Ø±ØªØ¬Ø¹.",
    metadata: {
      refund_method: refundMethod,
      refund_amount_omr: refundAmount
    }
  });

  revalidateReturnPaths(data.order_id, returnId);
  redirectAdminReturn(returnId, "success", "ØªÙ… ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø§Ø³ØªØ±Ø¯Ø§Ø¯ Ø§Ù„ÙŠØ¯ÙˆÙŠ.");
}

export async function closeReturnAction(returnId: string, formData: FormData) {
  const admin = await requireAdminRole(["owner", "manager"]);

  if (!admin) {
    redirectAdminReturn(returnId, "error", "Ù„ÙŠØ³Øª Ù„Ø¯ÙŠÙƒ ØµÙ„Ø§Ø­ÙŠØ© Ø¥ØºÙ„Ø§Ù‚ Ø§Ù„Ù…Ø±ØªØ¬Ø¹Ø§Øª.");
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
    redirectAdminReturn(returnId, "error", "ØªØ¹Ø°Ø± Ø¥ØºÙ„Ø§Ù‚ Ø§Ù„Ù…Ø±ØªØ¬Ø¹.");
  }

  await writeAdminReturnLogs({
    admin,
    orderId: data.order_id,
    returnId,
    eventType: "order.return_closed",
    auditAction: "return.close",
    title: "Ø¥ØºÙ„Ø§Ù‚ Ø§Ù„Ù…Ø±ØªØ¬Ø¹",
    description: "ØªÙ… Ø¥ØºÙ„Ø§Ù‚ Ø§Ù„Ù…Ø±ØªØ¬Ø¹ Ø¯ÙˆÙ† Ø§Ø³ØªØ±Ø¯Ø§Ø¯ Ø¥Ø¶Ø§ÙÙŠ."
  });

  revalidateReturnPaths(data.order_id, returnId);
  redirectAdminReturn(returnId, "success", "ØªÙ… Ø¥ØºÙ„Ø§Ù‚ Ø§Ù„Ù…Ø±ØªØ¬Ø¹.");
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



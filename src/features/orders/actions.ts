"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logAdminActivity } from "@/features/admin-audit/log";
import { requireAdminRole } from "@/features/auth/queries";
import { ensureInvoiceForOrder } from "@/features/invoices/actions";
import {
  getOrderStatusLabel,
  getStatusEventType
} from "@/features/orders/labels";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateOrderSchema, type OrderStatusValue } from "@/validations/order-schema";
import type { AdminProfile } from "@/features/auth/queries";
import type { Database, Json } from "@/types/database";

type OrderForUpdate = {
  id: string;
  status: OrderStatusValue;
  stock_deducted_at: string | null;
  order_items: Array<{
    id: string;
    product_id: string | null;
    product_name_ar_snapshot: string;
    quantity: number;
  }>;
};

type ProductStockRow = {
  id: string;
  name_ar: string;
  stock_quantity: number;
  track_stock: boolean;
};

type InventoryMovementInsert =
  Database["public"]["Tables"]["inventory_movements"]["Insert"];

const allowedTransitions: Record<OrderStatusValue, OrderStatusValue[]> = {
  pending: ["pending", "confirmed", "cancelled"],
  confirmed: ["confirmed", "preparing", "out_for_delivery", "completed", "cancelled"],
  preparing: ["preparing", "out_for_delivery", "completed", "cancelled"],
  out_for_delivery: ["out_for_delivery", "completed"],
  completed: ["completed"],
  cancelled: ["cancelled"]
};

export async function updateOrderAction(orderId: string, formData: FormData) {
  const admin = await requireAdminRole(["owner", "manager", "cashier"]);

  if (!admin) {
    redirectWithMessage(orderId, "error", "ليست لديك صلاحية لتحديث الطلب.");
  }

  const parsed = updateOrderSchema.safeParse({
    status: formData.get("status"),
    admin_notes: formData.get("admin_notes")
  });

  if (!parsed.success) {
    redirectWithMessage(
      orderId,
      "error",
      parsed.error.issues[0]?.message ?? "تعذر تحديث الطلب."
    );
  }

  const supabase = createAdminClient();
  const order = await getOrderForUpdate(orderId);

  if (!order) {
    redirectWithMessage(orderId, "error", "الطلب غير موجود.");
  }

  const nextStatus = parsed.data.status;

  if (!isTransitionAllowed(order.status, nextStatus)) {
    redirectWithMessage(orderId, "error", "لا يمكن الانتقال إلى هذه الحالة.");
  }

  try {
    const now = new Date().toISOString();
    const updatePayload: Database["public"]["Tables"]["orders"]["Update"] = {
      status: nextStatus,
      admin_notes: parsed.data.admin_notes,
      updated_by_admin_id: admin.id
    };

    if (nextStatus === "confirmed" && !order.stock_deducted_at) {
      await deductOrderStock(order, admin.id);
      updatePayload.stock_deducted_at = now;
      updatePayload.confirmed_at = now;
      updatePayload.cancelled_at = null;
      updatePayload.confirmed_by_admin_id = admin.id;
    }

    if (nextStatus === "cancelled") {
      if (order.stock_deducted_at) {
        await restoreOrderStock(order, admin.id);
        updatePayload.stock_deducted_at = null;
      }

      updatePayload.cancelled_at = now;
      updatePayload.cancelled_by_admin_id = admin.id;
    }

    if (nextStatus === "completed") {
      updatePayload.completed_at = now;
      updatePayload.completed_by_admin_id = admin.id;
    }

    if (nextStatus === "confirmed" && order.stock_deducted_at) {
      updatePayload.confirmed_at = order.stock_deducted_at;
      updatePayload.cancelled_at = null;
    }

    const { error } = await supabase
      .from("orders")
      .update(updatePayload)
      .eq("id", orderId);

    if (error) {
      throw error;
    }

    await logOrderEvent({
      orderId,
      admin,
      eventType: getStatusEventType(nextStatus),
      oldStatus: order.status,
      newStatus: nextStatus,
      title: "تغيير حالة الطلب",
      description: `تم تغيير الحالة من ${getOrderStatusLabel(order.status)} إلى ${getOrderStatusLabel(nextStatus)}`,
      metadata: {
        previous_status: order.status,
        next_status: nextStatus
      }
    });

    await logAdminActivity({
      admin,
      action: getOrderAuditAction(nextStatus),
      entityType: "order",
      entityId: orderId,
      description: `تم تحديث حالة الطلب من ${order.status} إلى ${nextStatus}`,
      metadata: {
        previous_status: order.status,
        next_status: nextStatus
      }
    });

    if (nextStatus === "confirmed") {
      await ensureInvoiceForOrder(orderId, admin);
    }
  } catch (error) {
    console.error("updateOrderAction failed", error);
    redirectWithMessage(orderId, "error", "تعذر تحديث الطلب. تحقق من المخزون وحاول مرة أخرى.");
  }

  revalidateAdminOrderPaths(orderId);
  redirectWithMessage(orderId, "success", "تم تحديث الطلب بنجاح.");
}

export async function assignOrderAction(orderId: string, formData: FormData) {
  const admin = await requireAdminRole(["owner", "manager"]);

  if (!admin) {
    redirectWithMessage(orderId, "error", "ليست لديك صلاحية لتعيين مسؤول الطلب.");
  }

  const assigneeId = String(formData.get("assigned_admin_id") ?? "");
  const supabase = createAdminClient();
  const { data: order } = await supabase
    .from("orders")
    .select("id,assigned_admin_id")
    .eq("id", orderId)
    .maybeSingle()
    .returns<{ id: string; assigned_admin_id: string | null } | null>();

  if (!order) {
    redirectWithMessage(orderId, "error", "الطلب غير موجود.");
  }

  const { data: assignee } = await supabase
    .from("admins")
    .select("id,full_name,display_name,email,role,is_active")
    .eq("id", assigneeId)
    .eq("is_active", true)
    .maybeSingle()
    .returns<{
      id: string;
      full_name: string;
      display_name: string | null;
      email: string;
      role: string;
      is_active: boolean;
    } | null>();

  if (!assignee) {
    redirectWithMessage(orderId, "error", "لا يمكن تعيين الطلب إلى إداري غير نشط.");
  }

  const { error } = await supabase
    .from("orders")
    .update({
      assigned_admin_id: assignee.id,
      updated_by_admin_id: admin.id
    })
    .eq("id", orderId);

  if (error) {
    redirectWithMessage(orderId, "error", "تعذر تعيين مسؤول الطلب.");
  }

  await logOrderEvent({
    orderId,
    admin,
    eventType: "order.assigned",
    title: "تعيين مسؤول الطلب",
    description: `تم تعيين الطلب إلى ${assignee.display_name || assignee.full_name}`,
    metadata: {
      previous_admin_id: order.assigned_admin_id,
      assigned_admin_id: assignee.id
    }
  });

  await logAdminActivity({
    admin,
    action: "order.assigned",
    entityType: "order",
    entityId: orderId,
    description: "تم تعيين مسؤول للطلب",
    metadata: { assigned_admin_id: assignee.id }
  });

  revalidateAdminOrderPaths(orderId);
  redirectWithMessage(orderId, "success", "تم تعيين مسؤول الطلب.");
}

export async function unassignOrderAction(orderId: string) {
  const admin = await requireAdminRole(["owner", "manager"]);

  if (!admin) {
    redirectWithMessage(orderId, "error", "ليست لديك صلاحية لإلغاء تعيين الطلب.");
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("orders")
    .update({
      assigned_admin_id: null,
      updated_by_admin_id: admin.id
    })
    .eq("id", orderId);

  if (error) {
    redirectWithMessage(orderId, "error", "تعذر إلغاء تعيين مسؤول الطلب.");
  }

  await logOrderEvent({
    orderId,
    admin,
    eventType: "order.unassigned",
    title: "إلغاء تعيين مسؤول الطلب",
    description: "تم إلغاء تعيين المسؤول عن الطلب"
  });

  await logAdminActivity({
    admin,
    action: "order.unassigned",
    entityType: "order",
    entityId: orderId,
    description: "تم إلغاء تعيين مسؤول الطلب"
  });

  revalidateAdminOrderPaths(orderId);
  redirectWithMessage(orderId, "success", "تم إلغاء تعيين مسؤول الطلب.");
}

export async function addOrderInternalNoteAction(orderId: string, formData: FormData) {
  const admin = await requireAdminRole(["owner", "manager", "cashier"]);

  if (!admin) {
    redirectWithMessage(orderId, "error", "ليست لديك صلاحية لإضافة ملاحظة.");
  }

  const note = String(formData.get("note") ?? "").trim();
  const isPinned = formData.get("is_pinned") === "on";

  if (note.length < 1 || note.length > 2000) {
    redirectWithMessage(orderId, "error", "الملاحظة يجب أن تكون بين 1 و2000 حرف.");
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("order_internal_notes")
    .insert({
      order_id: orderId,
      admin_id: admin.id,
      note,
      is_pinned: isPinned
    })
    .select("id")
    .single()
    .returns<{ id: string }>();

  if (error || !data) {
    redirectWithMessage(orderId, "error", "تعذر إضافة الملاحظة.");
  }

  await logOrderEvent({
    orderId,
    admin,
    eventType: "order.note_added",
    title: "إضافة ملاحظة داخلية",
    description: "تمت إضافة ملاحظة داخلية للطلب",
    metadata: { note_id: data.id, is_pinned: isPinned }
  });

  await logAdminActivity({
    admin,
    action: "order.note_added",
    entityType: "order",
    entityId: orderId,
    description: "تمت إضافة ملاحظة داخلية للطلب",
    metadata: { note_id: data.id }
  });

  revalidateAdminOrderPaths(orderId);
  redirectWithMessage(orderId, "success", "تمت إضافة الملاحظة.");
}

export async function updateOrderInternalNoteAction(orderId: string, noteId: string, formData: FormData) {
  const admin = await requireAdminRole(["owner", "manager", "cashier"]);

  if (!admin) {
    redirectWithMessage(orderId, "error", "ليست لديك صلاحية لتعديل الملاحظة.");
  }

  const note = String(formData.get("note") ?? "").trim();
  const isPinned = formData.get("is_pinned") === "on";

  if (note.length < 1 || note.length > 2000) {
    redirectWithMessage(orderId, "error", "الملاحظة يجب أن تكون بين 1 و2000 حرف.");
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("order_internal_notes")
    .update({ note, is_pinned: isPinned })
    .eq("id", noteId)
    .eq("order_id", orderId);

  if (error) {
    redirectWithMessage(orderId, "error", "تعذر تحديث الملاحظة.");
  }

  await logOrderEvent({
    orderId,
    admin,
    eventType: "order.note_updated",
    title: "تعديل ملاحظة داخلية",
    description: "تم تعديل ملاحظة داخلية للطلب",
    metadata: { note_id: noteId, is_pinned: isPinned }
  });

  await logAdminActivity({
    admin,
    action: "order.note_updated",
    entityType: "order",
    entityId: orderId,
    description: "تم تعديل ملاحظة داخلية للطلب",
    metadata: { note_id: noteId }
  });

  revalidateAdminOrderPaths(orderId);
  redirectWithMessage(orderId, "success", "تم تحديث الملاحظة.");
}

export async function deleteOrderInternalNoteAction(orderId: string, noteId: string) {
  const admin = await requireAdminRole(["owner", "manager", "cashier"]);

  if (!admin) {
    redirectWithMessage(orderId, "error", "ليست لديك صلاحية لحذف الملاحظة.");
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("order_internal_notes")
    .delete()
    .eq("id", noteId)
    .eq("order_id", orderId);

  if (error) {
    redirectWithMessage(orderId, "error", "تعذر حذف الملاحظة.");
  }

  await logOrderEvent({
    orderId,
    admin,
    eventType: "order.note_deleted",
    title: "حذف ملاحظة داخلية",
    description: "تم حذف ملاحظة داخلية من الطلب",
    metadata: { note_id: noteId }
  });

  await logAdminActivity({
    admin,
    action: "note.delete",
    entityType: "order",
    entityId: orderId,
    description: "تم حذف ملاحظة داخلية من الطلب",
    metadata: { note_id: noteId }
  });

  revalidateAdminOrderPaths(orderId);
  redirectWithMessage(orderId, "success", "تم حذف الملاحظة.");
}

export async function logOrderPrintAction(orderId: string, printType: "invoice" | "shipping_label") {
  const admin = await requireAdminRole(["owner", "manager", "cashier"]);

  if (!admin) {
    return { ok: false };
  }

  const eventType = printType === "invoice" ? "order.invoice_printed" : "order.shipping_label_printed";
  await logOrderEvent({
    orderId,
    admin,
    eventType,
    title: printType === "invoice" ? "طباعة الفاتورة" : "طباعة بوليصة الشحن",
    description: printType === "invoice" ? "تمت طباعة فاتورة الطلب" : "تمت طباعة بوليصة شحن الطلب"
  });

  await logAdminActivity({
    admin,
    action: eventType,
    entityType: "order",
    entityId: orderId,
    description: printType === "invoice" ? "تمت طباعة فاتورة الطلب" : "تمت طباعة بوليصة شحن الطلب"
  });

  revalidateAdminOrderPaths(orderId);
  return { ok: true };
}

function getOrderAuditAction(status: OrderStatusValue) {
  if (status === "cancelled") {
    return "order.cancel";
  }

  if (status === "completed") {
    return "order.complete";
  }

  return "order.status_change";
}

async function logOrderEvent({
  orderId,
  admin,
  eventType,
  oldStatus = null,
  newStatus = null,
  title,
  description = null,
  metadata = {}
}: {
  orderId: string;
  admin: AdminProfile;
  eventType: string;
  oldStatus?: string | null;
  newStatus?: string | null;
  title: string;
  description?: string | null;
  metadata?: Json;
}) {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("order_events").insert({
      order_id: orderId,
      admin_id: admin.id,
      auth_user_id: admin.auth_user_id,
      event_type: eventType,
      old_status: oldStatus,
      new_status: newStatus,
      title,
      description,
      metadata
    });

    if (error) {
      console.error("Failed to write order event", error);
    }
  } catch (error) {
    console.error("Failed to write order event", error);
  }
}

async function getOrderForUpdate(orderId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("orders")
    .select("id,status,stock_deducted_at,order_items(id,product_id,product_name_ar_snapshot,quantity)")
    .eq("id", orderId)
    .maybeSingle()
    .returns<OrderForUpdate | null>();

  return data;
}

function isTransitionAllowed(currentStatus: OrderStatusValue, nextStatus: OrderStatusValue) {
  return allowedTransitions[currentStatus].includes(nextStatus);
}

async function deductOrderStock(order: OrderForUpdate, adminId: string) {
  const lines = order.order_items.filter((item) => item.product_id);

  if (lines.length === 0) {
    return;
  }

  const products = await getProductsForOrder(lines.map((item) => item.product_id as string));
  const movements: InventoryMovementInsert[] = [];

  for (const line of lines) {
    const product = products.get(line.product_id as string);

    if (!product) {
      throw new Error("missing_product");
    }

    if (!product.track_stock) {
      continue;
    }

    if (product.stock_quantity < line.quantity) {
      throw new Error("insufficient_stock");
    }

    const stockBefore = product.stock_quantity;
    const stockAfter = stockBefore - line.quantity;
    await updateProductStock(product.id, stockAfter);
    product.stock_quantity = stockAfter;

    movements.push({
      product_id: product.id,
      order_id: order.id,
      admin_id: adminId,
      movement_type: "sale",
      quantity_change: -line.quantity,
      stock_before: stockBefore,
      stock_after: stockAfter,
      reason: "تأكيد طلب",
      notes: `خصم مخزون للطلب ${order.id}`
    });
  }

  await insertInventoryMovements(movements);
}

async function restoreOrderStock(order: OrderForUpdate, adminId: string) {
  const lines = order.order_items.filter((item) => item.product_id);

  if (lines.length === 0) {
    return;
  }

  const products = await getProductsForOrder(lines.map((item) => item.product_id as string));
  const movements: InventoryMovementInsert[] = [];

  for (const line of lines) {
    const product = products.get(line.product_id as string);

    if (!product || !product.track_stock) {
      continue;
    }

    const stockBefore = product.stock_quantity;
    const stockAfter = stockBefore + line.quantity;
    await updateProductStock(product.id, stockAfter);
    product.stock_quantity = stockAfter;

    movements.push({
      product_id: product.id,
      order_id: order.id,
      admin_id: adminId,
      movement_type: "cancelled_order",
      quantity_change: line.quantity,
      stock_before: stockBefore,
      stock_after: stockAfter,
      reason: "إلغاء طلب",
      notes: `استرجاع مخزون للطلب ${order.id}`
    });
  }

  await insertInventoryMovements(movements);
}

async function getProductsForOrder(productIds: string[]) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("products")
    .select("id,name_ar,stock_quantity,track_stock")
    .in("id", [...new Set(productIds)])
    .returns<ProductStockRow[]>();

  if (error) {
    throw error;
  }

  return new Map((data ?? []).map((product) => [product.id, product]));
}

async function updateProductStock(productId: string, stockQuantity: number) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("products")
    .update({ stock_quantity: stockQuantity })
    .eq("id", productId);

  if (error) {
    throw error;
  }
}

async function insertInventoryMovements(movements: InventoryMovementInsert[]) {
  if (movements.length === 0) {
    return;
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("inventory_movements").insert(movements);

  if (error) {
    throw error;
  }
}

function revalidateAdminOrderPaths(orderId: string) {
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin");
  revalidatePath("/admin/products");
  revalidatePath("/admin/inventory");
  revalidatePath("/admin/activity");
}

function redirectWithMessage(orderId: string, status: "success" | "error", message: string): never {
  const params = new URLSearchParams({ status, message });
  redirect(`/admin/orders/${orderId}?${params.toString()}`);
}

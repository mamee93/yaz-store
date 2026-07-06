"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/features/auth/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateOrderSchema, type OrderStatusValue } from "@/validations/order-schema";
import type { Database } from "@/types/database";

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
  out_for_delivery: ["out_for_delivery", "completed", "cancelled"],
  completed: ["completed"],
  cancelled: ["cancelled"]
};

export async function updateOrderAction(orderId: string, formData: FormData) {
  const admin = await requireAdmin();

  if (!admin) {
    redirect("/login");
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
      admin_notes: parsed.data.admin_notes
    };

    if (nextStatus === "confirmed" && !order.stock_deducted_at) {
      await deductOrderStock(order, admin.id);
      updatePayload.stock_deducted_at = now;
      updatePayload.confirmed_at = now;
      updatePayload.cancelled_at = null;
    }

    if (nextStatus === "cancelled") {
      if (order.stock_deducted_at) {
        await restoreOrderStock(order, admin.id);
        updatePayload.stock_deducted_at = null;
      }

      updatePayload.cancelled_at = now;
    }

    if (nextStatus === "completed") {
      updatePayload.completed_at = now;
    }

    if (nextStatus === "confirmed" && order.stock_deducted_at) {
      updatePayload.confirmed_at = order.stock_deducted_at;
      updatePayload.cancelled_at = null;
    }

    const { error } = await supabase
      .from("orders")
      .update(updatePayload as never)
      .eq("id", orderId);

    if (error) {
      throw error;
    }
  } catch {
    redirectWithMessage(orderId, "error", "تعذر تحديث الطلب. تحقق من المخزون وحاول مرة أخرى.");
  }

  revalidateAdminOrderPaths(orderId);
  redirectWithMessage(orderId, "success", "تم تحديث الطلب بنجاح.");
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
    .update({ stock_quantity: stockQuantity } as never)
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
  const { error } = await supabase.from("inventory_movements").insert(movements as never);

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
}

function redirectWithMessage(orderId: string, status: "success" | "error", message: string): never {
  const params = new URLSearchParams({ status, message });
  redirect(`/admin/orders/${orderId}?${params.toString()}`);
}

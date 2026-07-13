"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logAdminActivity } from "@/features/admin-audit/log";
import { requireAdminRole } from "@/features/auth/queries";
import { notifyInventoryStatusTransition } from "@/features/inventory/notifications";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";

type ProductStockRow = {
  id: string;
  name_ar: string;
  stock_quantity: number;
  low_stock_threshold: number;
  track_stock: boolean;
};

export async function restockProductAction(productId: string, formData: FormData) {
  const admin = await requireAdminRole(["owner", "manager"]);

  if (!admin) {
    redirect("/admin/inventory/alerts?status=error&message=\u0644\u064a\u0633\u062a \u0644\u062f\u064a\u0643 \u0635\u0644\u0627\u062d\u064a\u0629 \u0644\u062a\u0639\u062f\u064a\u0644 \u0627\u0644\u0645\u062e\u0632\u0648\u0646.");
  }

  const quantity = Number(formData.get("quantity") ?? 0);
  const reason = String(formData.get("reason") ?? "").trim();

  if (!Number.isInteger(quantity) || quantity <= 0) {
    redirect("/admin/inventory/alerts?status=error&message=\u0623\u062f\u062e\u0644 \u0643\u0645\u064a\u0629 \u0635\u062d\u064a\u062d\u0629 \u0623\u0643\u0628\u0631 \u0645\u0646 \u0635\u0641\u0631.");
  }

  const supabase = createAdminClient();
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id,name_ar,stock_quantity,low_stock_threshold,track_stock")
    .eq("id", productId)
    .is("deleted_at", null)
    .maybeSingle()
    .returns<ProductStockRow | null>();

  if (productError || !product) {
    redirect("/admin/inventory/alerts?status=error&message=\u062a\u0639\u0630\u0631 \u062a\u062d\u062f\u064a\u062f \u0627\u0644\u0645\u0646\u062a\u062c.");
  }

  const stockBefore = product.stock_quantity;
  const stockAfter = stockBefore + quantity;
  const { error: updateError } = await supabase
    .from("products")
    .update({ stock_quantity: stockAfter } satisfies Database["public"]["Tables"]["products"]["Update"])
    .eq("id", productId);

  if (updateError) {
    redirect("/admin/inventory/alerts?status=error&message=\u062a\u0639\u0630\u0631 \u062a\u062d\u062f\u064a\u062b \u0627\u0644\u0645\u062e\u0632\u0648\u0646.");
  }

  const { error: movementError } = await supabase.from("inventory_movements").insert({
    product_id: product.id,
    admin_id: admin.id,
    movement_type: "restock",
    quantity_change: quantity,
    stock_before: stockBefore,
    stock_after: stockAfter,
    reason: reason || "\u0625\u0636\u0627\u0641\u0629 \u0645\u062e\u0632\u0648\u0646",
    notes: reason || null
  } satisfies Database["public"]["Tables"]["inventory_movements"]["Insert"]);

  if (movementError) {
    console.error("Failed to write inventory movement", movementError);
  }

  await notifyInventoryStatusTransition({
    before: product,
    after: {
      ...product,
      stock_quantity: stockAfter
    }
  });

  await logAdminActivity({
    admin,
    action: "inventory.restock",
    entityType: "product",
    entityId: product.id,
    description: `Restocked ${product.name_ar}`,
    metadata: { quantity, stock_before: stockBefore, stock_after: stockAfter }
  });

  revalidatePath("/admin");
  revalidatePath("/admin/products");
  revalidatePath("/admin/inventory");
  revalidatePath("/admin/inventory/alerts");
  redirect("/admin/inventory/alerts?status=success&message=\u062a\u0645 \u062a\u062d\u062f\u064a\u062b \u0627\u0644\u0645\u062e\u0632\u0648\u0646.");
}

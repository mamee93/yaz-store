import { revalidatePath } from "next/cache";
import {
  getProductStockStatus,
  isStockAlertStatus,
  type ProductStockInput
} from "@/features/inventory/stock-status";
import { createAdminClient } from "@/lib/supabase/admin";

type ProductStockNotificationInput = ProductStockInput & {
  id: string;
  name_ar: string;
};

export async function notifyInventoryStatusTransition({
  before,
  after
}: {
  before: ProductStockNotificationInput;
  after: ProductStockNotificationInput;
}) {
  try {
    const previousStatus = getProductStockStatus(before);
    const nextStatus = getProductStockStatus(after);

    if (previousStatus === nextStatus || !isStockAlertStatus(nextStatus)) {
      return;
    }

    const notificationType =
      nextStatus === "out_of_stock" ? "inventory.out_of_stock" : "inventory.low_stock";
    const title =
      nextStatus === "out_of_stock"
        ? "\u0646\u0641\u062f \u0627\u0644\u0645\u062e\u0632\u0648\u0646"
        : "\u0645\u062e\u0632\u0648\u0646 \u0645\u0646\u062e\u0641\u0636";
    const message =
      nextStatus === "out_of_stock"
        ? `\u0646\u0641\u062f \u0645\u062e\u0632\u0648\u0646 \u0645\u0646\u062a\u062c ${after.name_ar}.`
        : `\u062a\u0628\u0642\u0649 ${after.stock_quantity ?? 0} \u0642\u0637\u0639\u0629 \u0645\u0646 \u0645\u0646\u062a\u062c ${after.name_ar}.`;

    const supabase = createAdminClient();
    const { data: existing, error: existingError } = await supabase
      .from("notifications")
      .select("id")
      .eq("type", notificationType)
      .eq("entity_type", "product")
      .eq("entity_id", after.id)
      .eq("is_read", false)
      .limit(1)
      .returns<Array<{ id: string }>>();

    if (existingError) {
      console.error("Failed to check inventory notification", existingError);
    }

    if (existing?.length) {
      return;
    }

    const { error } = await supabase.from("notifications").insert({
      type: notificationType,
      title,
      message,
      entity_type: "product",
      entity_id: after.id
    });

    if (error) {
      console.error("Failed to create inventory notification", error);
      return;
    }

    revalidatePath("/admin");
    revalidatePath("/admin/notifications");
    revalidatePath("/admin/inventory/alerts");
  } catch (error) {
    console.error("Inventory notification failed", error);
  }
}

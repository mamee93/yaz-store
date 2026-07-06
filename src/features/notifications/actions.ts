"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/features/auth/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";

type NotificationInsert = Database["public"]["Tables"]["notifications"]["Insert"];

export async function createOrderNotification({
  orderId,
  orderNumber,
  customerName,
  total
}: {
  orderId: string;
  orderNumber: string;
  customerName: string;
  total: number;
}) {
  const supabase = createAdminClient();
  const payload: NotificationInsert = {
    type: "new_order",
    title: "طلب جديد",
    message: `تم إنشاء الطلب ${orderNumber} بواسطة ${customerName} بإجمالي ${total.toFixed(3)} ر.ع`,
    entity_type: "order",
    entity_id: orderId
  };

  const { error } = await supabase.from("notifications").insert(payload as never);

  if (error) {
    console.error("Failed to create order notification", error);
  }
}

export async function markNotificationReadAction(formData: FormData) {
  const admin = await requireAdmin();

  if (!admin) {
    redirect("/login");
  }

  const notificationId = String(formData.get("notificationId") ?? "");

  if (!notificationId) {
    redirect("/admin/notifications?status=error&message=تعذر تحديد التنبيه.");
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true } as never)
    .eq("id", notificationId);

  if (error) {
    redirect("/admin/notifications?status=error&message=تعذر تحديث التنبيه.");
  }

  revalidateNotificationsPaths();
}

export async function markAllNotificationsReadAction() {
  const admin = await requireAdmin();

  if (!admin) {
    redirect("/login");
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true } as never)
    .eq("is_read", false);

  if (error) {
    redirect("/admin/notifications?status=error&message=تعذر تحديث التنبيهات.");
  }

  revalidateNotificationsPaths();
}

function revalidateNotificationsPaths() {
  revalidatePath("/admin");
  revalidatePath("/admin/notifications");
}

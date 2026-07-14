"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentCustomer, requireAdmin } from "@/features/auth/queries";
import { getCustomerIdsForAccount } from "@/features/customers/queries";
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

export async function createReturnRequestedNotification({
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
    const { data: existingNotification, error: existingError } = await supabase
      .from("notifications")
      .select("id")
      .eq("type", "return.requested")
      .eq("entity_type", "return")
      .eq("entity_id", returnId)
      .eq("is_read", false)
      .maybeSingle()
      .returns<{ id: string } | null>();

    if (existingError) {
      console.error("Failed to check existing return notification", existingError);
      return;
    }

    if (existingNotification) {
      return;
    }

    const payload: NotificationInsert = {
      type: "return.requested",
      title: "طلب إرجاع جديد",
      message: `تم استلام طلب إرجاع للطلب رقم ${orderNumber}`,
      entity_type: "return",
      entity_id: returnId,
      metadata: {
        return_id: returnId,
        order_id: orderId,
        order_number: orderNumber
      }
    };

    const { error } = await supabase.from("notifications").insert(payload as never);

    if (error) {
      console.error("Failed to create return notification", error);
      return;
    }

    revalidatePath("/admin");
    revalidatePath("/admin/notifications");
    revalidatePath("/admin/returns");
    revalidatePath(`/admin/returns/${returnId}`);
  } catch (error) {
    console.error("Failed to create return notification", error);
  }
}

export async function createCustomerRefundNotification({
  customerId,
  returnId,
  orderId,
  orderNumber,
  amount
}: {
  customerId: string | null;
  returnId: string;
  orderId: string;
  orderNumber: string;
  amount: number;
}) {
  if (!customerId) {
    return;
  }

  try {
    const supabase = createAdminClient();
    const { data: existingNotification, error: existingError } = await supabase
      .from("notifications")
      .select("id")
      .eq("type", "refund.completed")
      .eq("customer_id", customerId)
      .eq("entity_type", "order_return")
      .eq("entity_id", returnId)
      .limit(1)
      .maybeSingle()
      .returns<{ id: string } | null>();

    if (existingError) {
      console.error("Failed to check existing customer refund notification", existingError);
      return;
    }

    if (existingNotification) {
      return;
    }

    const payload: NotificationInsert = {
      type: "refund.completed",
      title: "تم استرداد المبلغ",
      message: `تم تسجيل استرداد مبلغ ${amount.toFixed(3)} ر.ع للطلب رقم ${orderNumber}`,
      entity_type: "order_return",
      entity_id: returnId,
      customer_id: customerId,
      link: `/account/returns/${returnId}`,
      metadata: {
        return_id: returnId,
        order_id: orderId,
        order_number: orderNumber,
        refund_amount_omr: amount
      }
    };

    const { error } = await supabase.from("notifications").insert(payload as never);

    if (error) {
      console.error("Failed to create customer refund notification", error);
      return;
    }

    revalidatePath("/account");
    revalidatePath(`/account/returns/${returnId}`);
  } catch (error) {
    console.error("Failed to create customer refund notification", error);
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

export async function markCustomerNotificationReadAction(notificationId: string) {
  const customer = await getCurrentCustomer();

  if (!customer) {
    redirect("/login");
  }

  const customerIds = await getCustomerIdsForAccount({
    id: customer.id,
    email: customer.email
  });

  if (customerIds.length === 0) {
    redirect("/account/notifications?status=error&message=تعذر تحديث الإشعار.");
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true } as never)
    .eq("id", notificationId)
    .in("customer_id", customerIds);

  if (error) {
    redirect("/account/notifications?status=error&message=تعذر تحديث الإشعار.");
  }

  revalidatePath("/account");
  revalidatePath("/account/notifications");
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

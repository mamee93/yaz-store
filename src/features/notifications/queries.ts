import { requireAdmin } from "@/features/auth/queries";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type AdminNotification =
  Database["public"]["Tables"]["notifications"]["Row"];

export async function getAdminNotifications(limit?: number) {
  const admin = await requireAdmin();

  if (!admin) {
    return [];
  }

  const supabase = await createClient();
  let query = supabase
    .from("notifications")
    .select("id,type,title,message,entity_type,entity_id,metadata,is_read,created_at")
    .order("created_at", { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query.returns<AdminNotification[]>();

  if (error) {
    console.error("Failed to read admin notifications", error);
    return [];
  }

  return data ?? [];
}

export async function getUnreadNotificationsCount() {
  const admin = await requireAdmin();

  if (!admin) {
    return 0;
  }

  const supabase = await createClient();
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("is_read", false);

  if (error) {
    console.error("Failed to count unread notifications", error);
    return 0;
  }

  return count ?? 0;
}

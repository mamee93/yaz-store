import { createAdminClient } from "@/lib/supabase/admin";
import type { AdminProfile } from "@/features/auth/queries";
import type { Json } from "@/types/database";

type AdminActor = Pick<
  AdminProfile,
  "id" | "auth_user_id" | "full_name" | "display_name" | "email" | "role"
>;

type LogAdminActivityInput = {
  admin: AdminActor | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  description?: string | null;
  metadata?: Json;
};

export async function logAdminActivity({
  admin,
  action,
  entityType,
  entityId = null,
  description = null,
  metadata = {}
}: LogAdminActivityInput) {
  if (!admin) {
    return;
  }

  try {
    const supabase = createAdminClient();
    const adminName = admin.display_name || admin.full_name || admin.email;

    const { error } = await supabase.from("admin_audit_logs").insert({
      admin_id: admin.id,
      auth_user_id: admin.auth_user_id,
      admin_name: adminName,
      admin_role: admin.role,
      action,
      entity_type: entityType,
      entity_id: entityId,
      description,
      metadata
    });

    if (error) {
      console.error("Failed to write admin audit log", error);
    }
  } catch (error) {
    console.error("Failed to write admin audit log", error);
  }
}

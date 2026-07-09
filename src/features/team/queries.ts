import { requireAdminRole } from "@/features/auth/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeAdminRole, type AdminRole } from "@/constants/admin-roles";
import type { Database } from "@/types/database";

export type TeamMember = Omit<Database["public"]["Tables"]["admins"]["Row"], "role"> & {
  role: AdminRole;
};

export async function getTeamMembers() {
  const owner = await requireAdminRole(["owner"]);

  if (!owner) {
    return [];
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("admins")
    .select("id,auth_user_id,full_name,display_name,email,role,is_active,invited_by,created_at,updated_at")
    .order("created_at", { ascending: true })
    .returns<Array<Database["public"]["Tables"]["admins"]["Row"]>>();

  if (error) {
    console.error("Failed to read team members", error);
    return [];
  }

  return (data ?? []).map((member) => ({
    ...member,
    role: normalizeAdminRole(member.role)
  })) satisfies TeamMember[];
}

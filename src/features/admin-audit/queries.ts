import { requireAdminRole } from "@/features/auth/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";

export type AdminAuditLog = Database["public"]["Tables"]["admin_audit_logs"]["Row"];

export type AdminAuditFilters = {
  search?: string;
  adminId?: string;
  action?: string;
  date?: string;
  page?: number;
};

export async function getAdminAuditLogs(filters: AdminAuditFilters = {}) {
  const admin = await requireAdminRole(["owner", "manager"]);

  if (!admin) {
    return { logs: [], count: 0, page: 1, pageSize: 20 };
  }

  const pageSize = 20;
  const page = Math.max(filters.page ?? 1, 1);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const supabase = createAdminClient();

  let query = supabase
    .from("admin_audit_logs")
    .select("id,admin_id,auth_user_id,admin_name,admin_role,action,entity_type,entity_id,description,metadata,created_at", {
      count: "exact"
    })
    .order("created_at", { ascending: false })
    .range(from, to);

  const search = filters.search?.trim();
  if (search) {
    query = query.or(`admin_name.ilike.%${search}%,action.ilike.%${search}%,entity_type.ilike.%${search}%,description.ilike.%${search}%`);
  }

  if (filters.adminId && filters.adminId !== "all") {
    query = query.eq("admin_id", filters.adminId);
  }

  if (filters.action && filters.action !== "all") {
    query = query.eq("action", filters.action);
  }

  if (filters.date) {
    const start = new Date(`${filters.date}T00:00:00.000Z`);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);
    query = query.gte("created_at", start.toISOString()).lt("created_at", end.toISOString());
  }

  const { data, error, count } = await query.returns<AdminAuditLog[]>();

  if (error) {
    console.error("Failed to read admin audit logs", error);
    return { logs: [], count: 0, page, pageSize };
  }

  return { logs: data ?? [], count: count ?? 0, page, pageSize };
}

export async function getAuditFilterOptions() {
  const admin = await requireAdminRole(["owner", "manager"]);

  if (!admin) {
    return { admins: [], actions: [] };
  }

  const supabase = createAdminClient();
  const [{ data: admins }, { data: logs }] = await Promise.all([
    supabase
      .from("admins")
      .select("id,full_name,display_name,email")
      .order("full_name", { ascending: true })
      .returns<
        Array<{
          id: string;
          full_name: string;
          display_name: string | null;
          email: string;
        }>
      >(),
    supabase
      .from("admin_audit_logs")
      .select("action")
      .order("action", { ascending: true })
      .limit(500)
      .returns<Array<Pick<AdminAuditLog, "action">>>()
  ]);

  return {
    admins: admins ?? [],
    actions: [...new Set((logs ?? []).map((log) => log.action))]
  };
}

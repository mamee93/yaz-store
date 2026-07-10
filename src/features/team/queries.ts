import { requireAdmin, requireAdminRole } from "@/features/auth/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeAdminRole, type AdminRole } from "@/constants/admin-roles";
import type { Database } from "@/types/database";

type AdminRow = Database["public"]["Tables"]["admins"]["Row"];
type AuditRow = Database["public"]["Tables"]["admin_audit_logs"]["Row"];

type OrderAttributionRow = {
  id: string;
  status: Database["public"]["Enums"]["order_status"];
  total_omr: number;
  created_by_admin_id: string | null;
  updated_by_admin_id: string | null;
  confirmed_by_admin_id: string | null;
  completed_by_admin_id: string | null;
  cancelled_by_admin_id: string | null;
};

export type TeamMember = Omit<AdminRow, "role"> & {
  role: AdminRole;
  activity_count: number;
  order_count: number;
  sales_total_omr: number;
  creator_name: string | null;
};

export type TeamMemberProfile = TeamMember & {
  latest_activities: AuditRow[];
};

export type TeamFilters = {
  search?: string;
  role?: string;
  status?: string;
};

export async function getTeamMembers(filters: TeamFilters = {}) {
  const owner = await requireAdminRole(["owner"]);

  if (!owner) {
    return [];
  }

  const supabase = createAdminClient();
  let query = supabase
    .from("admins")
    .select(
      "id,auth_user_id,full_name,display_name,email,phone,role,is_active,must_change_password,last_sign_in_at,created_by,invited_by,created_at,updated_at"
    )
    .order("created_at", { ascending: true });

  const search = filters.search?.trim();
  if (search) {
    query = query.or(`full_name.ilike.%${search}%,display_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
  }

  const role = normalizeFilterRole(filters.role);
  if (role) {
    query = query.eq("role", role);
  }

  if (filters.status === "active") {
    query = query.eq("is_active", true);
  }

  if (filters.status === "inactive") {
    query = query.eq("is_active", false);
  }

  const { data, error } = await query.returns<AdminRow[]>();

  if (error) {
    console.error("Failed to read team members", error);
    return [];
  }

  return hydrateTeamMembers(data ?? []);
}

export async function getTeamMemberProfile(memberId: string) {
  const admin = await requireAdmin();

  if (!admin || (admin.role !== "owner" && admin.id !== memberId)) {
    return null;
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("admins")
    .select(
      "id,auth_user_id,full_name,display_name,email,phone,role,is_active,must_change_password,last_sign_in_at,created_by,invited_by,created_at,updated_at"
    )
    .eq("id", memberId)
    .maybeSingle()
    .returns<AdminRow | null>();

  if (error || !data) {
    console.error("Failed to read team member", error);
    return null;
  }

  const [member] = await hydrateTeamMembers([data]);
  const { data: latestActivities, error: activityError } = await supabase
    .from("admin_audit_logs")
    .select("id,admin_id,auth_user_id,admin_name,admin_role,action,entity_type,entity_id,description,metadata,created_at")
    .eq("admin_id", memberId)
    .order("created_at", { ascending: false })
    .limit(20)
    .returns<AuditRow[]>();

  if (activityError) {
    console.error("Failed to read team member activities", activityError);
  }

  return {
    ...member,
    latest_activities: latestActivities ?? []
  } satisfies TeamMemberProfile;
}

async function hydrateTeamMembers(rows: AdminRow[]) {
  if (rows.length === 0) {
    return [];
  }

  const supabase = createAdminClient();
  const memberIds = rows.map((member) => member.id);
  const creatorIds = rows.flatMap((member) => member.created_by ?? member.invited_by ?? []);

  const [{ data: activities }, { data: orders }, { data: creators }] = await Promise.all([
    supabase
      .from("admin_audit_logs")
      .select("admin_id")
      .in("admin_id", memberIds)
      .limit(5000)
      .returns<Array<Pick<AuditRow, "admin_id">>>(),
    supabase
      .from("orders")
      .select(
        "id,status,total_omr,created_by_admin_id,updated_by_admin_id,confirmed_by_admin_id,completed_by_admin_id,cancelled_by_admin_id"
      )
      .or(
        [
          `created_by_admin_id.in.(${memberIds.join(",")})`,
          `updated_by_admin_id.in.(${memberIds.join(",")})`,
          `confirmed_by_admin_id.in.(${memberIds.join(",")})`,
          `completed_by_admin_id.in.(${memberIds.join(",")})`,
          `cancelled_by_admin_id.in.(${memberIds.join(",")})`
        ].join(",")
      )
      .limit(5000)
      .returns<OrderAttributionRow[]>(),
    creatorIds.length > 0
      ? supabase
          .from("admins")
          .select("id,full_name,display_name,email")
          .in("id", [...new Set(creatorIds)])
          .returns<Array<Pick<AdminRow, "id" | "full_name" | "display_name" | "email">>>()
      : Promise.resolve({ data: [], error: null })
  ]);

  const activityCounts = new Map<string, number>();
  for (const activity of activities ?? []) {
    if (activity.admin_id) {
      activityCounts.set(activity.admin_id, (activityCounts.get(activity.admin_id) ?? 0) + 1);
    }
  }

  const orderStats = new Map<string, { count: number; sales: number }>();
  for (const order of orders ?? []) {
    const adminIds = new Set(
      [
        order.created_by_admin_id,
        order.updated_by_admin_id,
        order.confirmed_by_admin_id,
        order.completed_by_admin_id,
        order.cancelled_by_admin_id
      ].filter(Boolean) as string[]
    );

    for (const adminId of adminIds) {
      const current = orderStats.get(adminId) ?? { count: 0, sales: 0 };
      current.count += 1;
      if (order.status === "completed") {
        current.sales += Number(order.total_omr ?? 0);
      }
      orderStats.set(adminId, current);
    }
  }

  const creatorNames = new Map(
    (creators ?? []).map((creator) => [
      creator.id,
      creator.display_name || creator.full_name || creator.email
    ])
  );

  return rows.map((member) => {
    const stats = orderStats.get(member.id) ?? { count: 0, sales: 0 };

    return {
      ...member,
      role: normalizeAdminRole(member.role),
      activity_count: activityCounts.get(member.id) ?? 0,
      order_count: stats.count,
      sales_total_omr: stats.sales,
      creator_name: creatorNames.get(member.created_by ?? member.invited_by ?? "") ?? null
    };
  }) satisfies TeamMember[];
}

function normalizeFilterRole(value: string | undefined) {
  if (!value || value === "all") {
    return null;
  }

  return normalizeAdminRole(value);
}

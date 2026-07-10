import { requireAdmin, requireAdminRole } from "@/features/auth/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeAdminRole, type AdminRole } from "@/constants/admin-roles";
import type { Database } from "@/types/database";

type OrderStatus = Database["public"]["Enums"]["order_status"];
type AdminRow = Database["public"]["Tables"]["admins"]["Row"];

export type PerformancePeriod = "today" | "7d" | "30d" | "all";
export type PerformanceSort = "sales" | "orders" | "activities" | "last_activity";

export type AdminPerformanceFilters = {
  period?: string;
  search?: string;
  role?: string;
  status?: string;
  sort?: string;
  includeOwner?: string;
};

export type AdminPerformanceRow = {
  admin_id: string;
  full_name: string;
  display_name: string | null;
  email: string;
  role: AdminRole;
  is_active: boolean;
  last_sign_in_at: string | null;
  total_activity_count: number;
  orders_created_count: number;
  orders_updated_count: number;
  orders_confirmed_count: number;
  orders_completed_count: number;
  orders_cancelled_count: number;
  attributed_orders_count: number;
  completed_sales_count: number;
  completed_sales_total_omr: number;
  average_completed_order_omr: number;
  last_activity_at: string | null;
};

export type RecentAttributedOrder = {
  id: string;
  order_number: string;
  status: OrderStatus;
  total_omr: number;
  created_at: string;
  attribution_type: "created" | "updated" | "confirmed" | "completed" | "cancelled";
};

type PerformanceOrder = {
  id: string;
  order_number: string;
  status: OrderStatus;
  total_omr: number | string;
  customer_name_snapshot: string;
  created_at: string;
  created_by_admin_id: string | null;
  updated_by_admin_id: string | null;
  confirmed_by_admin_id: string | null;
  completed_by_admin_id: string | null;
  cancelled_by_admin_id: string | null;
};

type ActivityLite = {
  admin_id: string | null;
  created_at: string;
};

export async function getAdminTeamPerformance(filters: AdminPerformanceFilters = {}) {
  const admin = await requireAdminRole(["owner", "manager"]);
  const period = normalizePeriod(filters.period);

  if (!admin) {
    return getEmptyPerformance(period);
  }

  const sort = normalizeSort(filters.sort);
  const range = getPeriodRange(period);
  const supabase = createAdminClient();

  let ordersQuery = supabase
    .from("orders")
    .select(
      "id,order_number,status,total_omr,customer_name_snapshot,created_at,created_by_admin_id,updated_by_admin_id,confirmed_by_admin_id,completed_by_admin_id,cancelled_by_admin_id"
    )
    .order("created_at", { ascending: false })
    .limit(10000);

  let activitiesQuery = supabase
    .from("admin_audit_logs")
    .select("admin_id,created_at")
    .order("created_at", { ascending: false })
    .limit(10000);

  if (range.start) {
    ordersQuery = ordersQuery.gte("created_at", range.start);
    activitiesQuery = activitiesQuery.gte("created_at", range.start);
  }

  const [{ data: admins }, { data: orders }, { data: activities }] = await Promise.all([
    supabase
      .from("admins")
      .select("id,auth_user_id,full_name,display_name,email,phone,role,is_active,must_change_password,last_sign_in_at,created_by,invited_by,created_at,updated_at")
      .order("created_at", { ascending: true })
      .returns<AdminRow[]>(),
    ordersQuery.returns<PerformanceOrder[]>(),
    activitiesQuery.returns<ActivityLite[]>()
  ]);

  const rows = buildPerformanceRows(admins ?? [], orders ?? [], activities ?? []);
  const filteredRows = sortPerformanceRows(filterPerformanceRows(rows, filters), sort);

  return {
    period,
    sort,
    rows: filteredRows,
    kpis: buildPerformanceKpis(filteredRows),
    topPerformers: buildTopPerformers(rows, filters.includeOwner === "true")
  };
}

export async function getAdminPerformanceProfile(adminId: string) {
  const admin = await requireAdmin();

  if (!admin || (admin.role !== "owner" && admin.role !== "manager" && admin.id !== adminId)) {
    return null;
  }

  const result = await getAdminTeamPerformance({ period: "all", includeOwner: "true" });
  const performance = result.rows.find((row) => row.admin_id === adminId) ?? null;

  if (!performance) {
    return null;
  }

  const recentOrders = await getRecentAttributedOrders(adminId);

  return {
    performance,
    recentOrders
  };
}

export async function getRecentAttributedOrders(adminId: string) {
  const admin = await requireAdmin();

  if (!admin || (admin.role !== "owner" && admin.role !== "manager" && admin.id !== adminId)) {
    return [];
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id,order_number,status,total_omr,customer_name_snapshot,created_at,created_by_admin_id,updated_by_admin_id,confirmed_by_admin_id,completed_by_admin_id,cancelled_by_admin_id"
    )
    .or(
      [
        `created_by_admin_id.eq.${adminId}`,
        `updated_by_admin_id.eq.${adminId}`,
        `confirmed_by_admin_id.eq.${adminId}`,
        `completed_by_admin_id.eq.${adminId}`,
        `cancelled_by_admin_id.eq.${adminId}`
      ].join(",")
    )
    .order("created_at", { ascending: false })
    .limit(25)
    .returns<PerformanceOrder[]>();

  if (error) {
    console.error("Failed to read attributed orders", error);
    return [];
  }

  return (data ?? [])
    .map((order) => {
      const attribution = getDisplayAttribution(order, adminId);

      return attribution
        ? {
            id: order.id,
            order_number: order.order_number,
            status: order.status,
            total_omr: toMoney(order.total_omr),
            created_at: order.created_at,
            attribution_type: attribution
          }
        : null;
    })
    .filter((order): order is RecentAttributedOrder => Boolean(order))
    .slice(0, 10);
}

function buildPerformanceRows(
  admins: AdminRow[],
  orders: PerformanceOrder[],
  activities: ActivityLite[]
) {
  const rows = new Map<string, AdminPerformanceRow>();

  for (const admin of admins) {
    rows.set(admin.id, {
      admin_id: admin.id,
      full_name: admin.full_name,
      display_name: admin.display_name,
      email: admin.email,
      role: normalizeAdminRole(admin.role),
      is_active: admin.is_active,
      last_sign_in_at: admin.last_sign_in_at,
      total_activity_count: 0,
      orders_created_count: 0,
      orders_updated_count: 0,
      orders_confirmed_count: 0,
      orders_completed_count: 0,
      orders_cancelled_count: 0,
      attributed_orders_count: 0,
      completed_sales_count: 0,
      completed_sales_total_omr: 0,
      average_completed_order_omr: 0,
      last_activity_at: null
    });
  }

  for (const activity of activities) {
    if (!activity.admin_id) {
      continue;
    }

    const row = rows.get(activity.admin_id);
    if (!row) {
      continue;
    }

    row.total_activity_count += 1;
    if (!row.last_activity_at || activity.created_at > row.last_activity_at) {
      row.last_activity_at = activity.created_at;
    }
  }

  for (const order of orders) {
    incrementField(rows, order.created_by_admin_id, "orders_created_count");
    incrementField(rows, order.updated_by_admin_id, "orders_updated_count");
    incrementField(rows, order.confirmed_by_admin_id, "orders_confirmed_count");
    incrementField(rows, order.completed_by_admin_id, "orders_completed_count");
    incrementField(rows, order.cancelled_by_admin_id, "orders_cancelled_count");

    const attributedAdminIds = new Set(
      [
        order.created_by_admin_id,
        order.updated_by_admin_id,
        order.confirmed_by_admin_id,
        order.completed_by_admin_id,
        order.cancelled_by_admin_id
      ].filter(Boolean) as string[]
    );

    for (const adminId of attributedAdminIds) {
      const row = rows.get(adminId);
      if (row) {
        row.attributed_orders_count += 1;
      }
    }

    if (order.status !== "completed") {
      continue;
    }

    // Completed sales are attributed once per order using this priority:
    // completed_by_admin_id -> confirmed_by_admin_id -> updated_by_admin_id -> created_by_admin_id.
    const salesAdminId =
      order.completed_by_admin_id ??
      order.confirmed_by_admin_id ??
      order.updated_by_admin_id ??
      order.created_by_admin_id;
    const salesRow = salesAdminId ? rows.get(salesAdminId) : null;

    if (salesRow) {
      salesRow.completed_sales_count += 1;
      salesRow.completed_sales_total_omr = roundMoney(
        salesRow.completed_sales_total_omr + toMoney(order.total_omr)
      );
    }
  }

  for (const row of rows.values()) {
    row.average_completed_order_omr =
      row.completed_sales_count > 0
        ? roundMoney(row.completed_sales_total_omr / row.completed_sales_count)
        : 0;
  }

  return [...rows.values()];
}

function incrementField(
  rows: Map<string, AdminPerformanceRow>,
  adminId: string | null,
  field: keyof Pick<
    AdminPerformanceRow,
    | "orders_created_count"
    | "orders_updated_count"
    | "orders_confirmed_count"
    | "orders_completed_count"
    | "orders_cancelled_count"
  >
) {
  if (!adminId) {
    return;
  }

  const row = rows.get(adminId);
  if (row) {
    row[field] += 1;
  }
}

function filterPerformanceRows(rows: AdminPerformanceRow[], filters: AdminPerformanceFilters) {
  const search = filters.search?.trim().toLowerCase();
  const role = filters.role && filters.role !== "all" ? normalizeAdminRole(filters.role) : null;
  const status = filters.status;

  return rows.filter((row) => {
    if (search) {
      const haystack = `${row.full_name} ${row.display_name ?? ""} ${row.email}`.toLowerCase();
      if (!haystack.includes(search)) {
        return false;
      }
    }

    if (role && row.role !== role) {
      return false;
    }

    if (status === "active" && !row.is_active) {
      return false;
    }

    if (status === "inactive" && row.is_active) {
      return false;
    }

    return true;
  });
}

function sortPerformanceRows(rows: AdminPerformanceRow[], sort: PerformanceSort) {
  return [...rows].sort((a, b) => {
    if (sort === "orders") {
      return b.attributed_orders_count - a.attributed_orders_count;
    }

    if (sort === "activities") {
      return b.total_activity_count - a.total_activity_count;
    }

    if (sort === "last_activity") {
      return toTime(b.last_activity_at) - toTime(a.last_activity_at);
    }

    return b.completed_sales_total_omr - a.completed_sales_total_omr;
  });
}

function buildPerformanceKpis(rows: AdminPerformanceRow[]) {
  const completedSalesCount = sum(rows.map((row) => row.completed_sales_count));
  const completedSalesTotal = sum(rows.map((row) => row.completed_sales_total_omr));

  return {
    activeTeamMembers: rows.filter((row) => row.is_active).length,
    attributedOrders: sum(rows.map((row) => row.attributed_orders_count)),
    completedOrders: completedSalesCount,
    completedSalesTotalOmr: completedSalesTotal,
    averageOrderOmr: completedSalesCount > 0 ? roundMoney(completedSalesTotal / completedSalesCount) : 0,
    activityCount: sum(rows.map((row) => row.total_activity_count))
  };
}

function buildTopPerformers(rows: AdminPerformanceRow[], includeOwner: boolean) {
  const pool = includeOwner ? rows : rows.filter((row) => row.role !== "owner");

  return {
    bySales: [...pool].sort((a, b) => b.completed_sales_total_omr - a.completed_sales_total_omr).slice(0, 3),
    byCompletedOrders: [...pool].sort((a, b) => b.completed_sales_count - a.completed_sales_count).slice(0, 3),
    byActivities: [...pool].sort((a, b) => b.total_activity_count - a.total_activity_count).slice(0, 3)
  };
}

function getDisplayAttribution(order: PerformanceOrder, adminId: string) {
  if (order.cancelled_by_admin_id === adminId) {
    return "cancelled" as const;
  }

  if (order.completed_by_admin_id === adminId) {
    return "completed" as const;
  }

  if (order.confirmed_by_admin_id === adminId) {
    return "confirmed" as const;
  }

  if (order.updated_by_admin_id === adminId) {
    return "updated" as const;
  }

  if (order.created_by_admin_id === adminId) {
    return "created" as const;
  }

  return null;
}

function normalizePeriod(value: string | undefined): PerformancePeriod {
  return value === "today" || value === "7d" || value === "all" ? value : "30d";
}

function normalizeSort(value: string | undefined): PerformanceSort {
  return value === "orders" || value === "activities" || value === "last_activity" ? value : "sales";
}

function getPeriodRange(period: PerformancePeriod) {
  if (period === "all") {
    return { start: null };
  }

  const start = new Date();
  start.setHours(0, 0, 0, 0);

  if (period === "7d") {
    start.setDate(start.getDate() - 6);
  }

  if (period === "30d") {
    start.setDate(start.getDate() - 29);
  }

  return { start: start.toISOString() };
}

function getEmptyPerformance(period: PerformancePeriod) {
  return {
    period,
    sort: "sales" as PerformanceSort,
    rows: [],
    kpis: buildPerformanceKpis([]),
    topPerformers: buildTopPerformers([], false)
  };
}

function toMoney(value: number | string | null | undefined) {
  return Number(value ?? 0);
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + Number(value ?? 0), 0);
}

function roundMoney(value: number) {
  return Number(value.toFixed(3));
}

function toTime(value: string | null) {
  return value ? new Date(value).getTime() : 0;
}

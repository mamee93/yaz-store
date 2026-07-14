import { getCurrentCustomer, requireAdmin } from "@/features/auth/queries";
import { getCustomerIdsForAccount } from "@/features/customers/queries";
import { getReturnEligibility } from "@/features/returns/calculations";
import type { ReturnStatus, ReturnType } from "@/features/returns/labels";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";

export type OrderReturnRow = Database["public"]["Tables"]["order_returns"]["Row"];
export type OrderReturnItemRow = Database["public"]["Tables"]["order_return_items"]["Row"];

export type ReturnOrderItem = Pick<
  Database["public"]["Tables"]["order_items"]["Row"],
  | "id"
  | "product_id"
  | "product_name_ar_snapshot"
  | "product_name_en_snapshot"
  | "sku_snapshot"
  | "unit_price_omr"
  | "quantity"
  | "line_total_omr"
  | "product_image_url_snapshot"
>;

export type ReturnOrder = Pick<
  Database["public"]["Tables"]["orders"]["Row"],
  | "id"
  | "order_number"
  | "customer_id"
  | "status"
  | "subtotal_omr"
  | "discount_omr"
  | "delivery_fee_omr"
  | "total_omr"
  | "customer_name_snapshot"
  | "customer_phone_snapshot"
  | "completed_at"
  | "updated_at"
  | "created_at"
> & {
  order_items: ReturnOrderItem[];
};

export type CustomerReturnListItem = OrderReturnRow & {
  order_number: string;
  expected_refund_omr: number;
};

export type AdminReturnListItem = CustomerReturnListItem & {
  customer_name: string;
  customer_phone: string;
};

export type ReturnDetail = OrderReturnRow & {
  order: ReturnOrder;
  items: Array<OrderReturnItemRow & { order_item: ReturnOrderItem | null }>;
  expected_refund_omr: number;
};

export type AdminReturnDetail = ReturnDetail & {
  customer_name: string;
  customer_phone: string;
  admin_names: Record<string, string>;
};

export type AdminOrderReturnSummaryItem = Pick<
  OrderReturnItemRow,
  "id" | "return_id" | "order_item_id" | "quantity" | "line_refund_omr"
>;

export type AdminOrderReturnSummary = Pick<
  OrderReturnRow,
  "id" | "order_id" | "status" | "return_type" | "reason" | "requested_at" | "refund_amount_omr" | "created_at"
> & {
  order_return_items: AdminOrderReturnSummaryItem[];
  expected_refund_omr: number;
};

export type AdminReturnFilters = {
  q?: string;
  status?: string;
  return_type?: string;
  date_from?: string;
  date_to?: string;
};

const orderSelect =
  "id,order_number,customer_id,status,subtotal_omr,discount_omr,delivery_fee_omr,total_omr,customer_name_snapshot,customer_phone_snapshot,completed_at,updated_at,created_at,order_items(id,product_id,product_name_ar_snapshot,product_name_en_snapshot,sku_snapshot,unit_price_omr,quantity,line_total_omr,product_image_url_snapshot)";

const returnSelect =
  "id,order_id,customer_id,status,return_type,reason,customer_note,admin_note,requested_at,approved_at,rejected_at,received_at,refunded_at,customer_refund_confirmed_at,approved_by_admin_id,rejected_by_admin_id,received_by_admin_id,refunded_by_admin_id,refund_method,refund_amount_omr,refund_reference,created_at,updated_at";

export async function getCustomerReturnOrder(orderId: string) {
  const customerIds = await getCurrentCustomerIds();

  if (customerIds.length === 0) {
    return null;
  }

  const supabase = createAdminClient();
  const [{ data: order, error: orderError }, openReturn] = await Promise.all([
    supabase
      .from("orders")
      .select(orderSelect)
      .eq("id", orderId)
      .in("customer_id", customerIds)
      .maybeSingle()
      .returns<ReturnOrder | null>(),
    getOpenReturnForOrder(orderId)
  ]);

  if (orderError) {
    console.error("Failed to read customer return order", orderError);
    return null;
  }

  if (!order) {
    return null;
  }

  return {
    order,
    openReturn,
    eligibility: getReturnEligibility(order, Boolean(openReturn))
  };
}

export async function getCustomerReturns() {
  const customerIds = await getCurrentCustomerIds();

  if (customerIds.length === 0) {
    return [];
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("order_returns")
    .select(returnSelect)
    .in("customer_id", customerIds)
    .order("requested_at", { ascending: false })
    .limit(30)
    .returns<OrderReturnRow[]>();

  if (error) {
    console.error("Failed to read customer returns", error);
    return [];
  }

  return hydrateReturnList(data ?? []);
}

export async function getCustomerReturnById(returnId: string) {
  const customerIds = await getCurrentCustomerIds();

  if (customerIds.length === 0) {
    return null;
  }

  const detail = await getReturnDetailById(returnId, false);

  if (!detail || !detail.customer_id || !customerIds.includes(detail.customer_id)) {
    return null;
  }

  return detail;
}

export async function getAdminReturns(filters: AdminReturnFilters = {}) {
  const admin = await requireAdmin();

  if (!admin) {
    return {
      returns: [],
      kpis: buildReturnKpis([])
    };
  }

  const supabase = createAdminClient();
  let query = supabase
    .from("order_returns")
    .select(returnSelect)
    .order("requested_at", { ascending: false })
    .limit(200);

  if (filters.status && filters.status !== "all" && isReturnStatus(filters.status)) {
    query = query.eq("status", filters.status);
  }

  if (filters.return_type && filters.return_type !== "all" && isReturnType(filters.return_type)) {
    query = query.eq("return_type", filters.return_type);
  }

  if (filters.date_from) {
    query = query.gte("requested_at", `${filters.date_from}T00:00:00.000Z`);
  }

  if (filters.date_to) {
    query = query.lte("requested_at", `${filters.date_to}T23:59:59.999Z`);
  }

  const { data, error } = await query.returns<OrderReturnRow[]>();

  if (error) {
    console.error("Failed to read admin returns", error);
    return {
      returns: [],
      kpis: buildReturnKpis([])
    };
  }

  const returns = await hydrateReturnList(data ?? []);
  const search = filters.q?.trim().toLocaleLowerCase("ar-OM");
  const filtered = search
    ? returns.filter((item) =>
        [item.order_number, item.customer_name, item.customer_phone, item.id]
          .filter(Boolean)
          .some((value) => value.toLocaleLowerCase("ar-OM").includes(search))
      )
    : returns;

  return {
    returns: filtered,
    kpis: buildReturnKpis(returns)
  };
}

export async function getAdminReturnById(returnId: string) {
  const admin = await requireAdmin();

  if (!admin) {
    return null;
  }

  const detail = await getReturnDetailById(returnId, true);

  if (!detail) {
    return null;
  }

  const adminIds = [
    detail.approved_by_admin_id,
    detail.rejected_by_admin_id,
    detail.received_by_admin_id,
    detail.refunded_by_admin_id
  ].filter(Boolean) as string[];

  return {
    ...detail,
    customer_name: detail.order.customer_name_snapshot,
    customer_phone: detail.order.customer_phone_snapshot,
    admin_names: await getAdminNames(adminIds)
  } satisfies AdminReturnDetail;
}

export async function getAdminOrderReturns(orderId: string) {
  const admin = await requireAdmin();

  if (!admin) {
    return [];
  }

  const supabase = createAdminClient();
  const { data: returns, error: returnsError } = await supabase
    .from("order_returns")
    .select("id,order_id,status,return_type,reason,requested_at,refund_amount_omr,created_at")
    .eq("order_id", orderId)
    .order("requested_at", { ascending: false })
    .returns<
      Array<
        Pick<
          OrderReturnRow,
          | "id"
          | "order_id"
          | "status"
          | "return_type"
          | "reason"
          | "requested_at"
          | "refund_amount_omr"
          | "created_at"
        >
      >
    >();

  if (returnsError) {
    console.error("Failed to read order returns summary", returnsError);
    return [];
  }

  if (!returns || returns.length === 0) {
    return [];
  }

  const returnIds = returns.map((item) => item.id);
  const { data: items, error: itemsError } = await supabase
    .from("order_return_items")
    .select("id,return_id,order_item_id,quantity,line_refund_omr")
    .in("return_id", returnIds)
    .returns<AdminOrderReturnSummaryItem[]>();

  if (itemsError) {
    console.error("Failed to read order return items summary", itemsError);
  }

  const itemsByReturnId = new Map<string, AdminOrderReturnSummaryItem[]>();

  for (const item of items ?? []) {
    const grouped = itemsByReturnId.get(item.return_id) ?? [];
    grouped.push(item);
    itemsByReturnId.set(item.return_id, grouped);
  }

  return returns.map((returnRequest) => {
    const returnItems = itemsByReturnId.get(returnRequest.id) ?? [];
    const expectedRefund = sumReturnItems(returnItems);

    return {
      ...returnRequest,
      order_return_items: returnItems,
      expected_refund_omr: expectedRefund > 0 ? expectedRefund : Number(returnRequest.refund_amount_omr ?? 0)
    } satisfies AdminOrderReturnSummary;
  });
}

export async function getOpenReturnForOrder(orderId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("order_returns")
    .select("id,status")
    .eq("order_id", orderId)
    .in("status", ["requested", "approved", "received"])
    .limit(1)
    .maybeSingle()
    .returns<Pick<OrderReturnRow, "id" | "status"> | null>();

  if (error) {
    console.error("Failed to read open return", error);
    return null;
  }

  return data;
}

async function getReturnDetailById(returnId: string, includeAdminNote: boolean) {
  const supabase = createAdminClient();
  const { data: returnRow, error } = await supabase
    .from("order_returns")
    .select(returnSelect)
    .eq("id", returnId)
    .maybeSingle()
    .returns<OrderReturnRow | null>();

  if (error || !returnRow) {
    console.error("Failed to read return detail", error);
    return null;
  }

  const [{ data: order, error: orderError }, { data: items, error: itemsError }] =
    await Promise.all([
      supabase
        .from("orders")
        .select(orderSelect)
        .eq("id", returnRow.order_id)
        .maybeSingle()
        .returns<ReturnOrder | null>(),
      supabase
        .from("order_return_items")
        .select(
          "id,return_id,order_item_id,quantity,unit_refund_omr,line_refund_omr,return_to_stock,created_at"
        )
        .eq("return_id", returnId)
        .returns<OrderReturnItemRow[]>()
    ]);

  if (orderError || itemsError || !order) {
    console.error("Failed to read return detail relations", orderError ?? itemsError);
    return null;
  }

  const orderItemsById = new Map(order.order_items.map((item) => [item.id, item]));
  const detailedItems = (items ?? []).map((item) => ({
    ...item,
    order_item: orderItemsById.get(item.order_item_id) ?? null
  }));

  return {
    ...returnRow,
    admin_note: includeAdminNote ? returnRow.admin_note : null,
    order,
    items: detailedItems,
    expected_refund_omr: sumReturnItems(items ?? [])
  } satisfies ReturnDetail;
}

async function hydrateReturnList(rows: OrderReturnRow[]) {
  if (rows.length === 0) {
    return [];
  }

  const supabase = createAdminClient();
  const orderIds = [...new Set(rows.map((item) => item.order_id))];
  const returnIds = rows.map((item) => item.id);
  const [{ data: orders }, { data: items }] = await Promise.all([
    supabase
      .from("orders")
      .select("id,order_number,customer_name_snapshot,customer_phone_snapshot")
      .in("id", orderIds)
      .returns<
        Array<{
          id: string;
          order_number: string;
          customer_name_snapshot: string;
          customer_phone_snapshot: string;
        }>
      >(),
    supabase
      .from("order_return_items")
      .select("return_id,line_refund_omr")
      .in("return_id", returnIds)
      .returns<Array<Pick<OrderReturnItemRow, "return_id" | "line_refund_omr">>>()
  ]);

  const ordersById = new Map((orders ?? []).map((order) => [order.id, order]));
  const totals = new Map<string, number>();

  for (const item of items ?? []) {
    totals.set(item.return_id, (totals.get(item.return_id) ?? 0) + Number(item.line_refund_omr));
  }

  return rows.map((row) => {
    const order = ordersById.get(row.order_id);

    return {
      ...row,
      order_number: order?.order_number ?? "-",
      customer_name: order?.customer_name_snapshot ?? "-",
      customer_phone: order?.customer_phone_snapshot ?? "-",
      expected_refund_omr: totals.get(row.id) ?? 0
    } satisfies AdminReturnListItem;
  });
}

function buildReturnKpis(returns: AdminReturnListItem[]) {
  return {
    requested: returns.filter((item) => item.status === "requested").length,
    pendingReview: returns.filter((item) => item.status === "requested").length,
    approved: returns.filter((item) => item.status === "approved").length,
    received: returns.filter((item) => item.status === "received").length,
    refunded: returns.filter((item) => item.status === "refunded").length,
    rejected: returns.filter((item) => item.status === "rejected").length
  };
}

async function getCurrentCustomerIds() {
  const profile = await getCurrentCustomer();

  if (!profile || (!profile.id && !profile.email)) {
    return [];
  }

  return getCustomerIdsForAccount({
    id: profile.id,
    email: profile.email
  });
}

async function getAdminNames(adminIds: string[]) {
  if (adminIds.length === 0) {
    return {};
  }

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("admins")
    .select("id,full_name,display_name,email")
    .in("id", [...new Set(adminIds)])
    .returns<Array<{ id: string; full_name: string; display_name: string | null; email: string }>>();

  return Object.fromEntries(
    (data ?? []).map((admin) => [admin.id, admin.display_name || admin.full_name || admin.email])
  );
}

function sumReturnItems(items: Array<Pick<OrderReturnItemRow, "line_refund_omr">>) {
  return items.reduce((total, item) => total + Number(item.line_refund_omr), 0);
}

function isReturnStatus(value: string): value is ReturnStatus {
  return ["requested", "approved", "rejected", "received", "refunded", "closed"].includes(value);
}

function isReturnType(value: string): value is ReturnType {
  return ["full_return", "partial_return", "exchange", "refund_only"].includes(value);
}

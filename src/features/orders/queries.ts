import { requireAdmin } from "@/features/auth/queries";
import { getAdminOrderReturns, type AdminOrderReturnSummary } from "@/features/returns/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeAdminRole, type AdminRole } from "@/constants/admin-roles";
import type { Database, Json } from "@/types/database";

type OrderStatus = Database["public"]["Enums"]["order_status"];
type PaymentMethod = Database["public"]["Enums"]["payment_method"];
type PaymentStatus = Database["public"]["Enums"]["payment_status"];
type AdminRow = Database["public"]["Tables"]["admins"]["Row"];

const validOrderStatuses: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "out_for_delivery",
  "completed",
  "cancelled"
];

const validPaymentMethods: PaymentMethod[] = [
  "cash_on_delivery",
  "bank_transfer",
  "manual_confirmation",
  "tap_payments"
];

const adminOrdersPageSize = 100;

export type AdminOrderListItem = {
  id: string;
  order_number: string;
  invoice_number: string | null;
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  total_omr: number;
  customer_name_snapshot: string;
  customer_phone_snapshot: string;
  stock_deducted_at: string | null;
  assigned_admin_id: string | null;
  assigned_admin_name: string | null;
  assigned_admin_role: AdminRole | null;
  created_at: string;
};

export type AdminOrderDetail = AdminOrderListItem & {
  customer_id: string;
  address_id: string;
  subtotal_omr: number;
  delivery_fee_omr: number;
  discount_omr: number;
  tax_omr: number;
  coupon_code: string | null;
  delivery_method: "pickup_office" | "home_delivery" | null;
  customer_notes: string | null;
  admin_notes: string | null;
  delivery_address_snapshot: Json;
  confirmed_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  invoice_id: string | null;
  assigned_admin: OrderAdminLite | null;
  order_items: AdminOrderItem[];
  payments: AdminPaymentItem[];
  returns: AdminOrderReturnSummary[];
  events: OrderEventItem[];
  internal_notes: OrderInternalNoteItem[];
  assignable_admins: OrderAdminLite[];
};

export type OrderAdminLite = {
  id: string;
  full_name: string;
  display_name: string | null;
  email: string;
  role: AdminRole;
  is_active: boolean;
  last_sign_in_at: string | null;
};

export type OrderEventItem = {
  id: string;
  order_id: string;
  admin_id: string | null;
  auth_user_id: string | null;
  event_type: string;
  old_status: string | null;
  new_status: string | null;
  title: string;
  description: string | null;
  metadata: Json;
  created_at: string;
  admin_name: string | null;
};

export type OrderInternalNoteItem = {
  id: string;
  order_id: string;
  admin_id: string | null;
  note: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  admin_name: string | null;
};

export type AdminOrderItem = {
  id: string;
  product_id: string | null;
  product_name_ar_snapshot: string;
  product_name_en_snapshot: string | null;
  sku_snapshot: string | null;
  unit_price_omr: number;
  quantity: number;
  line_total_omr: number;
  product_image_url_snapshot: string | null;
};

export type AdminPaymentItem = {
  id: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amount_omr: number;
  provider: string | null;
  created_at: string;
};

export type AdminOrderFilters = {
  q?: string;
  status?: string;
  assigned_admin_id?: string;
  payment_method?: string;
  date_from?: string;
  date_to?: string;
};

type OrderListRow = Database["public"]["Tables"]["orders"]["Row"];
type OrderDetailRow = OrderListRow & {
  order_items: AdminOrderItem[];
  payments: AdminPaymentItem[];
};

export async function getAdminOrders(filters: AdminOrderFilters = {}) {
  const admin = await requireAdmin();

  if (!admin) {
    return [];
  }

  const supabase = createAdminClient();
  let query = supabase
    .from("orders")
    .select(
      "id,order_number,invoice_number,customer_id,address_id,status,payment_method,payment_status,subtotal_omr,delivery_fee_omr,discount_omr,tax_omr,total_omr,coupon_code,shipping_zone_id,shipping_area,shipping_fee_omr,delivery_method,customer_name_snapshot,customer_phone_snapshot,delivery_address_snapshot,customer_notes,admin_notes,stock_deducted_at,confirmed_at,completed_at,cancelled_at,created_by_admin_id,updated_by_admin_id,confirmed_by_admin_id,completed_by_admin_id,cancelled_by_admin_id,assigned_admin_id,created_at,updated_at"
    )
    .order("created_at", { ascending: false })
    .limit(adminOrdersPageSize);

  const search = filters.q?.trim();
  if (search) {
    query = query.or(
      `order_number.ilike.%${search}%,customer_name_snapshot.ilike.%${search}%,customer_phone_snapshot.ilike.%${search}%`
    );
  }

  if (filters.status && filters.status !== "all" && isOrderStatus(filters.status)) {
    query = query.eq("status", filters.status);
  }

  if (
    filters.payment_method &&
    filters.payment_method !== "all" &&
    isPaymentMethod(filters.payment_method)
  ) {
    query = query.eq("payment_method", filters.payment_method);
  }

  if (filters.assigned_admin_id === "unassigned") {
    query = query.is("assigned_admin_id", null);
  } else if (filters.assigned_admin_id && filters.assigned_admin_id !== "all") {
    query = query.eq("assigned_admin_id", filters.assigned_admin_id);
  }

  if (filters.date_from) {
    query = query.gte("created_at", `${filters.date_from}T00:00:00.000Z`);
  }

  if (filters.date_to) {
    query = query.lte("created_at", `${filters.date_to}T23:59:59.999Z`);
  }

  const { data, error } = await query.returns<OrderListRow[]>();

  if (error) {
    console.error("Failed to read admin orders", error);
    return [];
  }

  const admins = await getAdminsById(
    [...new Set((data ?? []).map((order) => order.assigned_admin_id).filter(Boolean) as string[])]
  );

  return (data ?? []).map((order) => {
    const assignedAdmin = order.assigned_admin_id ? admins.get(order.assigned_admin_id) : null;

    return {
      id: order.id,
      order_number: order.order_number,
      invoice_number: order.invoice_number,
      status: order.status,
      payment_method: order.payment_method,
      payment_status: order.payment_status,
      total_omr: order.total_omr,
      customer_name_snapshot: order.customer_name_snapshot,
      customer_phone_snapshot: order.customer_phone_snapshot,
      stock_deducted_at: order.stock_deducted_at,
      assigned_admin_id: order.assigned_admin_id,
      assigned_admin_name: assignedAdmin ? assignedAdmin.display_name || assignedAdmin.full_name : null,
      assigned_admin_role: assignedAdmin?.role ?? null,
      created_at: order.created_at
    };
  }) satisfies AdminOrderListItem[];
}

export async function getAdminOrderById(orderId: string) {
  const admin = await requireAdmin();

  if (!admin) {
    return null;
  }

  const supabase = createAdminClient();
  const [
    { data: order, error: orderError },
    { data: events, error: eventsError },
    { data: notes, error: notesError },
    { data: invoice, error: invoiceError },
    orderReturns,
    { data: assignableAdmins, error: adminsError }
  ] = await Promise.all([
    supabase
      .from("orders")
      .select(
        "id,order_number,invoice_number,customer_id,address_id,status,payment_method,payment_status,subtotal_omr,delivery_fee_omr,discount_omr,tax_omr,total_omr,coupon_code,shipping_zone_id,shipping_area,shipping_fee_omr,delivery_method,customer_name_snapshot,customer_phone_snapshot,delivery_address_snapshot,customer_notes,admin_notes,stock_deducted_at,confirmed_at,completed_at,cancelled_at,created_by_admin_id,updated_by_admin_id,confirmed_by_admin_id,completed_by_admin_id,cancelled_by_admin_id,assigned_admin_id,created_at,updated_at,order_items(id,product_id,product_name_ar_snapshot,product_name_en_snapshot,sku_snapshot,unit_price_omr,quantity,line_total_omr,product_image_url_snapshot),payments(id,method,status,amount_omr,provider,created_at)"
      )
      .eq("id", orderId)
      .maybeSingle()
      .returns<OrderDetailRow | null>(),
    supabase
      .from("order_events")
      .select("id,order_id,admin_id,auth_user_id,event_type,old_status,new_status,title,description,metadata,created_at")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false })
      .limit(50)
      .returns<Array<Database["public"]["Tables"]["order_events"]["Row"]>>(),
    supabase
      .from("order_internal_notes")
      .select("id,order_id,admin_id,note,is_pinned,created_at,updated_at")
      .eq("order_id", orderId)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(20)
      .returns<Array<Database["public"]["Tables"]["order_internal_notes"]["Row"]>>(),
    supabase
      .from("invoices")
      .select("id")
      .eq("order_id", orderId)
      .maybeSingle()
      .returns<{ id: string } | null>(),
    getAdminOrderReturns(orderId),
    supabase
      .from("admins")
      .select("id,full_name,display_name,email,role,is_active,last_sign_in_at")
      .eq("is_active", true)
      .order("full_name", { ascending: true })
      .returns<AdminRow[]>()
  ]);

  if (orderError || !order) {
    console.error("Failed to read admin order", orderError);
    return null;
  }

  if (eventsError || notesError || invoiceError || adminsError) {
    console.error("Failed to read advanced order data", eventsError ?? notesError ?? invoiceError ?? adminsError);
  }

  const adminIds = [
    order.assigned_admin_id,
    ...(events ?? []).map((event) => event.admin_id),
    ...(notes ?? []).map((note) => note.admin_id)
  ].filter(Boolean) as string[];
  const adminMap = await getAdminsById([...new Set(adminIds)]);
  const assignedAdmin = order.assigned_admin_id
    ? adminMap.get(order.assigned_admin_id) ?? null
    : null;

  return {
    ...order,
    assigned_admin_name: assignedAdmin ? assignedAdmin.display_name || assignedAdmin.full_name : null,
    assigned_admin_role: assignedAdmin?.role ?? null,
    invoice_id: invoice?.id ?? null,
    assigned_admin: assignedAdmin,
    returns: orderReturns,
    events:
      events && events.length > 0
        ? events.map((event) => ({
            ...event,
            admin_name: event.admin_id
              ? adminMap.get(event.admin_id)?.display_name ?? adminMap.get(event.admin_id)?.full_name ?? null
              : null
          }))
        : buildFallbackEvents(order),
    internal_notes: (notes ?? []).map((note) => ({
      ...note,
      admin_name: note.admin_id
        ? adminMap.get(note.admin_id)?.display_name ?? adminMap.get(note.admin_id)?.full_name ?? null
        : null
    })),
    assignable_admins: (assignableAdmins ?? []).map(toOrderAdminLite)
  } satisfies AdminOrderDetail;
}

export async function getAssignableAdmins() {
  const admin = await requireAdmin();

  if (!admin) {
    return [];
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("admins")
    .select("id,full_name,display_name,email,role,is_active,last_sign_in_at")
    .eq("is_active", true)
    .order("full_name", { ascending: true })
    .returns<AdminRow[]>();

  if (error) {
    console.error("Failed to read assignable admins", error);
    return [];
  }

  return (data ?? []).map(toOrderAdminLite);
}

async function getAdminsById(adminIds: string[]) {
  if (adminIds.length === 0) {
    return new Map<string, OrderAdminLite>();
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("admins")
    .select("id,full_name,display_name,email,role,is_active,last_sign_in_at")
    .in("id", adminIds)
    .returns<AdminRow[]>();

  if (error) {
    console.error("Failed to read order admins", error);
    return new Map<string, OrderAdminLite>();
  }

  return new Map((data ?? []).map((item) => [item.id, toOrderAdminLite(item)]));
}

function toOrderAdminLite(admin: AdminRow): OrderAdminLite {
  return {
    id: admin.id,
    full_name: admin.full_name,
    display_name: admin.display_name,
    email: admin.email,
    role: normalizeAdminRole(admin.role),
    is_active: admin.is_active,
    last_sign_in_at: admin.last_sign_in_at
  };
}

function buildFallbackEvents(order: OrderDetailRow): OrderEventItem[] {
  return [
    {
      id: `fallback-${order.id}`,
      order_id: order.id,
      admin_id: null,
      auth_user_id: null,
      event_type: "order.created",
      old_status: null,
      new_status: order.status,
      title: "إنشاء الطلب",
      description: "حدث افتراضي للطلبات القديمة التي لا تحتوي على Timeline محفوظ.",
      metadata: {},
      created_at: order.created_at,
      admin_name: null
    }
  ];
}

function isOrderStatus(value: string): value is OrderStatus {
  return validOrderStatuses.includes(value as OrderStatus);
}

function isPaymentMethod(value: string): value is PaymentMethod {
  return validPaymentMethods.includes(value as PaymentMethod);
}

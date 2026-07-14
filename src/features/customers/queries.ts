import { getCurrentCustomer, requireAdmin } from "@/features/auth/queries";
import { isActiveCustomerOrderStatus } from "@/features/orders/customer-labels";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type CustomerRow = Database["public"]["Tables"]["customers"]["Row"];
export type CustomerAddressRow = Database["public"]["Tables"]["addresses"]["Row"];

export type CustomerOrderRow = {
  id: string;
  order_number: string;
  invoice_number?: string | null;
  invoice_id?: string | null;
  customer_id: string;
  status: Database["public"]["Enums"]["order_status"];
  payment_method: Database["public"]["Enums"]["payment_method"];
  payment_status: Database["public"]["Enums"]["payment_status"];
  total_omr: number;
  completed_at?: string | null;
  updated_at?: string | null;
  created_at: string;
};

export type AdminCustomerListItem = CustomerRow & {
  total_orders: number;
  total_spent_omr: number;
  last_order_at: string | null;
};

export type AdminCustomerDetail = AdminCustomerListItem & {
  addresses: CustomerAddressRow[];
  orders: CustomerOrderRow[];
  average_order_value_omr: number;
  last_order: CustomerOrderRow | null;
};

export type CustomerAccount = {
  profile: Awaited<ReturnType<typeof getCurrentCustomer>>;
  orders: CustomerOrderRow[];
};

export type CustomerNotificationItem = Pick<
  Database["public"]["Tables"]["notifications"]["Row"],
  "id" | "type" | "title" | "message" | "link" | "is_read" | "created_at"
>;

export type CustomerReturnOverviewItem = Database["public"]["Tables"]["order_returns"]["Row"] & {
  order_number: string;
  expected_refund_omr: number;
};

export type CustomerAccountOverview = {
  profile: Awaited<ReturnType<typeof getCurrentCustomer>>;
  kpis: {
    totalOrders: number;
    activeOrders: number;
    completedOrders: number;
    totalPurchasesOmr: number;
    returnsCount: number;
    unreadNotifications: number;
  };
  recentOrders: CustomerOrderRow[];
  allOrders: CustomerOrderRow[];
  recentReturns: CustomerReturnOverviewItem[];
  recentNotifications: CustomerNotificationItem[];
  deliveryProfileComplete: boolean;
};

export async function getCustomerAccount() {
  const profile = await getCurrentCustomer();

  if (!profile) {
    return null;
  }

  if (!profile.id && !profile.email) {
    return {
      profile,
      orders: []
    };
  }

  const supabase = createAdminClient();
  const customerIds = await getCustomerIdsForAccount({
    id: profile.id,
    email: profile.email
  });

  if (customerIds.length === 0) {
    return {
      profile,
      orders: []
    };
  }

  const { data, error } = await supabase
    .from("orders")
    .select("id,order_number,invoice_number,customer_id,status,payment_method,payment_status,total_omr,completed_at,updated_at,created_at")
    .in("customer_id", customerIds)
    .order("created_at", { ascending: false })
    .limit(8)
    .returns<CustomerOrderRow[]>();

  if (error) {
    console.error("Failed to read customer account orders", error);
    return {
      profile,
      orders: []
    };
  }

  return {
    profile,
    orders: await attachInvoiceIds(data ?? [])
  };
}

export async function getCustomerAccountOverview() {
  const profile = await getCurrentCustomer();

  if (!profile) {
    return null;
  }

  const customerIds = await getCustomerIdsForAccount({
    id: profile.id,
    email: profile.email
  });

  if (customerIds.length === 0) {
    return {
      profile,
      kpis: {
        totalOrders: 0,
        activeOrders: 0,
        completedOrders: 0,
        totalPurchasesOmr: 0,
        returnsCount: 0,
        unreadNotifications: 0
      },
      recentOrders: [],
      allOrders: [],
      recentReturns: [],
      recentNotifications: [],
      deliveryProfileComplete: isDeliveryProfileComplete(profile)
    } satisfies CustomerAccountOverview;
  }

  const supabase = createAdminClient();
  const [{ data: orders, error: ordersError }, returns, { data: notifications, error: notificationsError }] =
    await Promise.all([
      supabase
        .from("orders")
        .select("id,order_number,invoice_number,customer_id,status,payment_method,payment_status,total_omr,completed_at,updated_at,created_at")
        .in("customer_id", customerIds)
        .order("created_at", { ascending: false })
        .limit(100)
        .returns<CustomerOrderRow[]>(),
      getCustomerReturnOverviewItems(customerIds, 30),
      supabase
        .from("notifications")
        .select("id,type,title,message,link,is_read,created_at")
        .in("customer_id", customerIds)
        .order("created_at", { ascending: false })
        .limit(100)
        .returns<CustomerNotificationItem[]>()
    ]);

  if (ordersError) {
    console.error("Failed to read customer overview orders", ordersError);
  }

  if (notificationsError) {
    console.error("Failed to read customer overview notifications", notificationsError);
  }

  const allOrders = await attachInvoiceIds(orders ?? []);

  return {
    profile,
    kpis: buildCustomerKpis(allOrders, returns, notifications ?? []),
    recentOrders: allOrders.slice(0, 5),
    allOrders,
    recentReturns: returns.slice(0, 3),
    recentNotifications: notifications ?? [],
    deliveryProfileComplete: isDeliveryProfileComplete(profile)
  } satisfies CustomerAccountOverview;
}

export async function getCustomerIdsForAccount({ id, email }: { id: string | null; email: string | null }) {
  const ids = new Set<string>();

  if (id) {
    ids.add(id);
  }

  if (!email) {
    return [...ids];
  }

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("customers")
    .select("id")
    .eq("email", email)
    .is("auth_user_id", null)
    .returns<Array<{ id: string }>>();

  for (const customer of data ?? []) {
    ids.add(customer.id);
  }

  return [...ids];
}

async function attachInvoiceIds(orders: CustomerOrderRow[]) {
  if (orders.length === 0) {
    return orders;
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("invoices")
    .select("id,order_id")
    .in(
      "order_id",
      orders.map((order) => order.id)
    )
    .returns<Array<{ id: string; order_id: string }>>();

  if (error) {
    console.error("Failed to read customer account invoice ids", error);
    return orders;
  }

  const invoiceIdByOrderId = new Map((data ?? []).map((invoice) => [invoice.order_id, invoice.id]));

  return orders.map((order) => ({
    ...order,
    invoice_id: invoiceIdByOrderId.get(order.id) ?? null
  }));
}

async function getCustomerReturnOverviewItems(customerIds: string[], limit: number) {
  if (customerIds.length === 0) {
    return [];
  }

  const supabase = createAdminClient();
  const { data: returns, error: returnsError } = await supabase
    .from("order_returns")
    .select("id,order_id,customer_id,status,return_type,reason,customer_note,admin_note,requested_at,approved_at,rejected_at,received_at,refunded_at,customer_refund_confirmed_at,approved_by_admin_id,rejected_by_admin_id,received_by_admin_id,refunded_by_admin_id,refund_method,refund_amount_omr,refund_reference,created_at,updated_at")
    .in("customer_id", customerIds)
    .order("requested_at", { ascending: false })
    .limit(limit)
    .returns<Database["public"]["Tables"]["order_returns"]["Row"][]>();

  if (returnsError || !returns || returns.length === 0) {
    if (returnsError) {
      console.error("Failed to read customer overview returns", returnsError);
    }

    return [];
  }

  const orderIds = [...new Set(returns.map((item) => item.order_id))];
  const returnIds = returns.map((item) => item.id);
  const [{ data: orders }, { data: items }] = await Promise.all([
    supabase
      .from("orders")
      .select("id,order_number")
      .in("id", orderIds)
      .returns<Array<{ id: string; order_number: string }>>(),
    supabase
      .from("order_return_items")
      .select("return_id,line_refund_omr")
      .in("return_id", returnIds)
      .returns<Array<{ return_id: string; line_refund_omr: number }>>()
  ]);

  const orderNumberById = new Map((orders ?? []).map((order) => [order.id, order.order_number]));
  const totalsByReturnId = new Map<string, number>();

  for (const item of items ?? []) {
    totalsByReturnId.set(item.return_id, (totalsByReturnId.get(item.return_id) ?? 0) + Number(item.line_refund_omr));
  }

  return returns.map((item) => ({
    ...item,
    order_number: orderNumberById.get(item.order_id) ?? "-",
    expected_refund_omr: totalsByReturnId.get(item.id) ?? Number(item.refund_amount_omr ?? 0)
  })) satisfies CustomerReturnOverviewItem[];
}

function buildCustomerKpis(
  orders: CustomerOrderRow[],
  returns: CustomerReturnOverviewItem[],
  notifications: CustomerNotificationItem[]
) {
  return {
    totalOrders: orders.length,
    activeOrders: orders.filter((order) => isActiveCustomerOrderStatus(order.status)).length,
    completedOrders: orders.filter((order) => order.status === "completed").length,
    totalPurchasesOmr: orders
      .filter((order) => order.status === "completed")
      .reduce((total, order) => total + Number(order.total_omr), 0),
    returnsCount: returns.length,
    unreadNotifications: notifications.filter((notification) => !notification.is_read).length
  };
}

function isDeliveryProfileComplete(profile: CustomerAccountOverview["profile"]) {
  return Boolean(
    profile?.full_name?.trim() &&
      profile.phone?.trim() &&
      profile.governorate?.trim() &&
      profile.wilayat?.trim() &&
      profile.detailed_address?.trim()
  );
}

export async function getAdminCustomers(search?: string) {
  const admin = await requireAdmin();

  if (!admin) {
    return [];
  }

  const supabase = await createClient();
  const [{ data: customers, error: customersError }, { data: orders, error: ordersError }] =
    await Promise.all([
      supabase
        .from("customers")
        .select("id,auth_user_id,full_name,phone,email,whatsapp_number,governorate,wilayat,area,detailed_address,notes,created_at,updated_at")
        .order("created_at", { ascending: false })
        .limit(500)
        .returns<CustomerRow[]>(),
      supabase
        .from("orders")
        .select(
          "id,order_number,customer_id,status,payment_method,payment_status,total_omr,created_at"
        )
        .order("created_at", { ascending: false })
        .limit(2000)
        .returns<CustomerOrderRow[]>()
    ]);

  if (customersError || ordersError) {
    console.error("Failed to read admin customers", customersError ?? ordersError);
    return [];
  }

  const ordersByCustomer = groupOrdersByCustomer(orders ?? []);
  const normalizedSearch = normalizeSearch(search);

  return (customers ?? [])
    .filter((customer) => matchesCustomerSearch(customer, normalizedSearch))
    .map((customer) => buildCustomerListItem(customer, ordersByCustomer.get(customer.id) ?? []));
}

export async function getAdminCustomerById(customerId: string) {
  const admin = await requireAdmin();

  if (!admin) {
    return null;
  }

  const supabase = await createClient();
  const [
    { data: customer, error: customerError },
    { data: addresses, error: addressesError },
    { data: orders, error: ordersError }
  ] = await Promise.all([
    supabase
      .from("customers")
      .select("id,auth_user_id,full_name,phone,email,whatsapp_number,governorate,wilayat,area,detailed_address,notes,created_at,updated_at")
      .eq("id", customerId)
      .maybeSingle()
      .returns<CustomerRow | null>(),
    supabase
      .from("addresses")
      .select(
        "id,customer_id,full_name,phone,country,governorate,wilayat,city,area,address_line_1,address_line_2,postal_code,delivery_notes,is_default,created_at,updated_at"
      )
      .eq("customer_id", customerId)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(20)
      .returns<CustomerAddressRow[]>(),
    supabase
      .from("orders")
      .select(
        "id,order_number,customer_id,status,payment_method,payment_status,total_omr,created_at"
      )
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false })
      .limit(100)
      .returns<CustomerOrderRow[]>()
  ]);

  if (customerError || addressesError || ordersError) {
    console.error(
      "Failed to read admin customer detail",
      customerError ?? addressesError ?? ordersError
    );
    return null;
  }

  if (!customer) {
    return null;
  }

  return buildCustomerDetail(customer, addresses ?? [], orders ?? []);
}

function buildCustomerListItem(
  customer: CustomerRow,
  orders: CustomerOrderRow[]
): AdminCustomerListItem {
  const spentOrders = getSpentOrders(orders);
  const totalSpent = spentOrders.reduce((total, order) => total + order.total_omr, 0);

  return {
    ...customer,
    total_orders: orders.length,
    total_spent_omr: totalSpent,
    last_order_at: orders[0]?.created_at ?? null
  };
}

function buildCustomerDetail(
  customer: CustomerRow,
  addresses: CustomerAddressRow[],
  orders: CustomerOrderRow[]
): AdminCustomerDetail {
  const listItem = buildCustomerListItem(customer, orders);
  const spentOrders = getSpentOrders(orders);

  return {
    ...listItem,
    addresses,
    orders,
    average_order_value_omr:
      spentOrders.length > 0 ? listItem.total_spent_omr / spentOrders.length : 0,
    last_order: orders[0] ?? null
  };
}

function groupOrdersByCustomer(orders: CustomerOrderRow[]) {
  return orders.reduce((groups, order) => {
    const customerOrders = groups.get(order.customer_id) ?? [];
    customerOrders.push(order);
    groups.set(order.customer_id, customerOrders);
    return groups;
  }, new Map<string, CustomerOrderRow[]>());
}

function getSpentOrders(orders: CustomerOrderRow[]) {
  return orders.filter((order) => order.status !== "cancelled");
}

function matchesCustomerSearch(customer: CustomerRow, search: string) {
  if (!search) {
    return true;
  }

  return [customer.full_name, customer.phone, customer.email]
    .filter(Boolean)
    .some((value) => normalizeSearch(value).includes(search));
}

function normalizeSearch(value?: string | null) {
  return value?.trim().toLocaleLowerCase("ar-OM") ?? "";
}

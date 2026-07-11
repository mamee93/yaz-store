import { getCurrentCustomer, requireAdmin } from "@/features/auth/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type CustomerRow = Database["public"]["Tables"]["customers"]["Row"];
export type CustomerAddressRow = Database["public"]["Tables"]["addresses"]["Row"];

export type CustomerOrderRow = {
  id: string;
  order_number: string;
  customer_id: string;
  status: Database["public"]["Enums"]["order_status"];
  payment_method: Database["public"]["Enums"]["payment_method"];
  payment_status: Database["public"]["Enums"]["payment_status"];
  total_omr: number;
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
    .select("id,order_number,customer_id,status,payment_method,payment_status,total_omr,created_at")
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
    orders: data ?? []
  };
}

async function getCustomerIdsForAccount({ id, email }: { id: string | null; email: string | null }) {
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

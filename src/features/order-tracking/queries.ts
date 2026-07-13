import { getCurrentCustomer } from "@/features/auth/queries";
import { getCustomerIdsForAccount } from "@/features/customers/queries";
import { verifyTrackingToken } from "@/features/order-tracking/tokens";
import { phonesMatch } from "@/features/order-tracking/phone";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AdminInvoice } from "@/features/invoices/queries";
import type { Database, Json } from "@/types/database";

export type PublicTrackableOrder = {
  id: string;
  order_number: string;
  invoice_number: string | null;
  status: Database["public"]["Enums"]["order_status"];
  payment_method: Database["public"]["Enums"]["payment_method"];
  payment_status: Database["public"]["Enums"]["payment_status"];
  total_omr: number;
  customer_name_snapshot: string;
  customer_phone_snapshot: string;
  created_at: string;
  updated_at: string;
};

export type CustomerOrderItem = Pick<
  Database["public"]["Tables"]["order_items"]["Row"],
  | "id"
  | "product_name_ar_snapshot"
  | "product_name_en_snapshot"
  | "sku_snapshot"
  | "unit_price_omr"
  | "quantity"
  | "line_total_omr"
  | "product_image_url_snapshot"
>;

export type CustomerOrderDetail = PublicTrackableOrder & {
  customer_id: string;
  subtotal_omr: number;
  delivery_fee_omr: number;
  discount_omr: number;
  tax_omr: number;
  delivery_address_snapshot: Json;
  order_items: CustomerOrderItem[];
  invoice_id: string | null;
};

const publicOrderSelect =
  "id,order_number,invoice_number,status,payment_method,payment_status,total_omr,customer_name_snapshot,customer_phone_snapshot,created_at,updated_at";

const customerOrderSelect =
  "id,order_number,invoice_number,customer_id,status,payment_method,payment_status,subtotal_omr,delivery_fee_omr,discount_omr,tax_omr,total_omr,customer_name_snapshot,customer_phone_snapshot,delivery_address_snapshot,created_at,updated_at,order_items(id,product_name_ar_snapshot,product_name_en_snapshot,sku_snapshot,unit_price_omr,quantity,line_total_omr,product_image_url_snapshot)";

export async function findTrackableOrder(identifier: string, phone: string) {
  const trimmedIdentifier = identifier.trim();

  if (!trimmedIdentifier || !phone.trim()) {
    return null;
  }

  const supabase = createAdminClient();
  const [{ data: byOrderNumber, error: orderError }, { data: byInvoiceNumber, error: invoiceError }] =
    await Promise.all([
      supabase
        .from("orders")
        .select(publicOrderSelect)
        .eq("order_number", trimmedIdentifier)
        .limit(3)
        .returns<PublicTrackableOrder[]>(),
      supabase
        .from("orders")
        .select(publicOrderSelect)
        .eq("invoice_number", trimmedIdentifier)
        .limit(3)
        .returns<PublicTrackableOrder[]>()
    ]);

  if (orderError || invoiceError) {
    console.error("Failed to read public order tracking lookup", orderError ?? invoiceError);
    return null;
  }

  const candidates = [...(byOrderNumber ?? []), ...(byInvoiceNumber ?? [])];
  return candidates.find((order) => phonesMatch(phone, order.customer_phone_snapshot)) ?? null;
}

export async function getTrackableOrderByToken(token?: string | null) {
  const payload = verifyTrackingToken(token);

  if (!payload) {
    return null;
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select(publicOrderSelect)
    .eq("id", payload.orderId)
    .maybeSingle()
    .returns<PublicTrackableOrder | null>();

  if (error) {
    console.error("Failed to read public tracked order", error);
    return null;
  }

  return data;
}

export async function getCustomerOrderDetail(orderId: string) {
  const customerIds = await getCurrentCustomerIds();

  if (customerIds.length === 0) {
    return null;
  }

  const supabase = createAdminClient();
  const { data: order, error } = await supabase
    .from("orders")
    .select(customerOrderSelect)
    .eq("id", orderId)
    .in("customer_id", customerIds)
    .maybeSingle()
    .returns<Omit<CustomerOrderDetail, "invoice_id"> | null>();

  if (error) {
    console.error("Failed to read customer order detail", error);
    return null;
  }

  if (!order) {
    return null;
  }

  return {
    ...order,
    invoice_id: await getInvoiceIdByOrderId(order.id)
  } satisfies CustomerOrderDetail;
}

export async function getCustomerInvoiceForOrder(orderId: string) {
  const customerOrder = await getCustomerOrderDetail(orderId);

  if (!customerOrder?.invoice_id) {
    return null;
  }

  const supabase = createAdminClient();
  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .select("id,order_id,invoice_number,issued_at,created_by_admin_id,created_at,updated_at")
    .eq("id", customerOrder.invoice_id)
    .maybeSingle()
    .returns<Database["public"]["Tables"]["invoices"]["Row"] | null>();

  if (invoiceError || !invoice) {
    console.error("Failed to read customer invoice", invoiceError);
    return null;
  }

  return {
    ...invoice,
    order: {
      id: customerOrder.id,
      order_number: customerOrder.order_number,
      invoice_number: customerOrder.invoice_number,
      status: customerOrder.status,
      payment_method: customerOrder.payment_method,
      payment_status: customerOrder.payment_status,
      subtotal_omr: customerOrder.subtotal_omr,
      delivery_fee_omr: customerOrder.delivery_fee_omr,
      discount_omr: customerOrder.discount_omr,
      tax_omr: customerOrder.tax_omr,
      total_omr: customerOrder.total_omr,
      customer_name_snapshot: customerOrder.customer_name_snapshot,
      customer_phone_snapshot: customerOrder.customer_phone_snapshot,
      delivery_address_snapshot: customerOrder.delivery_address_snapshot,
      created_at: customerOrder.created_at,
      confirmed_at: null,
      order_items: customerOrder.order_items.map((item) => ({
        id: item.id,
        product_name_ar_snapshot: item.product_name_ar_snapshot,
        product_name_en_snapshot: item.product_name_en_snapshot,
        sku_snapshot: item.sku_snapshot,
        unit_price_omr: item.unit_price_omr,
        quantity: item.quantity,
        line_total_omr: item.line_total_omr
      }))
    }
  } satisfies AdminInvoice;
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

async function getInvoiceIdByOrderId(orderId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("invoices")
    .select("id")
    .eq("order_id", orderId)
    .maybeSingle()
    .returns<{ id: string } | null>();

  if (error) {
    console.error("Failed to read customer order invoice id", error);
    return null;
  }

  return data?.id ?? null;
}

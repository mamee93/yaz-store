import { requireAdmin } from "@/features/auth/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database, Json } from "@/types/database";

type InvoiceRow = Database["public"]["Tables"]["invoices"]["Row"];
type OrderRow = Database["public"]["Tables"]["orders"]["Row"] & {
  order_items: InvoiceOrderItem[];
};

export type InvoiceOrderItem = {
  id: string;
  product_name_ar_snapshot: string;
  product_name_en_snapshot: string | null;
  sku_snapshot: string | null;
  unit_price_omr: number;
  quantity: number;
  line_total_omr: number;
};

export type AdminInvoice = InvoiceRow & {
  order: {
    id: string;
    order_number: string;
    invoice_number: string | null;
    status: Database["public"]["Enums"]["order_status"];
    payment_method: Database["public"]["Enums"]["payment_method"];
    payment_status: Database["public"]["Enums"]["payment_status"];
    subtotal_omr: number;
    delivery_fee_omr: number;
    discount_omr: number;
    tax_omr: number;
    total_omr: number;
    customer_name_snapshot: string;
    customer_phone_snapshot: string;
    delivery_address_snapshot: Json;
    created_at: string;
    confirmed_at: string | null;
    order_items: InvoiceOrderItem[];
  };
};

export async function getAdminInvoiceById(invoiceId: string) {
  const admin = await requireAdmin();

  if (!admin) {
    return null;
  }

  const supabase = createAdminClient();
  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .select("id,order_id,invoice_number,issued_at,created_by_admin_id,created_at,updated_at")
    .eq("id", invoiceId)
    .maybeSingle()
    .returns<InvoiceRow | null>();

  if (invoiceError || !invoice) {
    console.error("Failed to read invoice", invoiceError);
    return null;
  }

  const order = await getInvoiceOrder(invoice.order_id);

  if (!order) {
    return null;
  }

  return {
    ...invoice,
    order
  } satisfies AdminInvoice;
}

export async function getInvoiceIdByOrderId(orderId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("invoices")
    .select("id")
    .eq("order_id", orderId)
    .maybeSingle()
    .returns<{ id: string } | null>();

  if (error) {
    console.error("Failed to read order invoice id", error);
    return null;
  }

  return data?.id ?? null;
}

async function getInvoiceOrder(orderId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id,order_number,invoice_number,status,payment_method,payment_status,subtotal_omr,delivery_fee_omr,discount_omr,tax_omr,total_omr,customer_name_snapshot,customer_phone_snapshot,delivery_address_snapshot,created_at,confirmed_at,order_items(id,product_name_ar_snapshot,product_name_en_snapshot,sku_snapshot,unit_price_omr,quantity,line_total_omr)"
    )
    .eq("id", orderId)
    .maybeSingle()
    .returns<OrderRow | null>();

  if (error || !data) {
    console.error("Failed to read invoice order", error);
    return null;
  }

  return data;
}

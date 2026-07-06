import { requireAdmin } from "@/features/auth/queries";
import { createClient } from "@/lib/supabase/server";
import type { Database, Json } from "@/types/database";

export type AdminOrderListItem = {
  id: string;
  order_number: string;
  status: Database["public"]["Enums"]["order_status"];
  payment_method: Database["public"]["Enums"]["payment_method"];
  payment_status: Database["public"]["Enums"]["payment_status"];
  total_omr: number;
  customer_name_snapshot: string;
  customer_phone_snapshot: string;
  stock_deducted_at: string | null;
  created_at: string;
};

export type AdminOrderDetail = AdminOrderListItem & {
  customer_id: string;
  address_id: string;
  subtotal_omr: number;
  delivery_fee_omr: number;
  discount_omr: number;
  customer_notes: string | null;
  admin_notes: string | null;
  delivery_address_snapshot: Json;
  confirmed_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  order_items: AdminOrderItem[];
  payments: AdminPaymentItem[];
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
  method: Database["public"]["Enums"]["payment_method"];
  status: Database["public"]["Enums"]["payment_status"];
  amount_omr: number;
  provider: string | null;
  created_at: string;
};

export async function getAdminOrders() {
  const admin = await requireAdmin();

  if (!admin) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id,order_number,status,payment_method,payment_status,total_omr,customer_name_snapshot,customer_phone_snapshot,stock_deducted_at,created_at"
    )
    .order("created_at", { ascending: false })
    .returns<AdminOrderListItem[]>();

  if (error) {
    console.error("Failed to read admin orders", error);
    return [];
  }

  return data ?? [];
}

export async function getAdminOrderById(orderId: string) {
  const admin = await requireAdmin();

  if (!admin) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id,order_number,customer_id,address_id,status,payment_method,payment_status,subtotal_omr,delivery_fee_omr,discount_omr,total_omr,customer_name_snapshot,customer_phone_snapshot,delivery_address_snapshot,customer_notes,admin_notes,stock_deducted_at,confirmed_at,completed_at,cancelled_at,created_at,order_items(id,product_id,product_name_ar_snapshot,product_name_en_snapshot,sku_snapshot,unit_price_omr,quantity,line_total_omr,product_image_url_snapshot),payments(id,method,status,amount_omr,provider,created_at)"
    )
    .eq("id", orderId)
    .maybeSingle()
    .returns<AdminOrderDetail | null>();

  if (error) {
    console.error("Failed to read admin order", error);
    return null;
  }

  return data;
}

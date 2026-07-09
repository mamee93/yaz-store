import { createAdminClient } from "@/lib/supabase/admin";
import type { Database, Json } from "@/types/database";

export type CheckoutOrderRead = {
  id: string;
  order_number: string;
  status: Database["public"]["Enums"]["order_status"];
  payment_method: Database["public"]["Enums"]["payment_method"];
  payment_status: Database["public"]["Enums"]["payment_status"];
  subtotal_omr: number;
  delivery_fee_omr: number;
  discount_omr: number;
  tax_omr: number;
  total_omr: number;
  coupon_code: string | null;
  delivery_method: "pickup_office" | "home_delivery" | null;
  customer_name_snapshot: string;
  customer_phone_snapshot: string;
  delivery_address_snapshot: Json;
  customer_notes: string | null;
  created_at: string;
  order_items: {
    id: string;
    product_name_ar_snapshot: string;
    unit_price_omr: number;
    quantity: number;
    line_total_omr: number;
    product_image_url_snapshot: string | null;
  }[];
};

export async function getOrderByOrderNumber(orderNumber: string) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("orders")
    .select(
      "id,order_number,status,payment_method,payment_status,subtotal_omr,delivery_fee_omr,discount_omr,tax_omr,total_omr,coupon_code,delivery_method,customer_name_snapshot,customer_phone_snapshot,delivery_address_snapshot,customer_notes,created_at,order_items(id,product_name_ar_snapshot,unit_price_omr,quantity,line_total_omr,product_image_url_snapshot)"
    )
    .eq("order_number", orderNumber)
    .maybeSingle()
    .returns<CheckoutOrderRead | null>();

  if (error) {
    console.error("Failed to read checkout order", error);
    return null;
  }

  return data;
}

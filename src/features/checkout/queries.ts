import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentCustomer, type CustomerProfile } from "@/features/auth/queries";
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

export type CheckoutPrefillAddress = Pick<
  Database["public"]["Tables"]["addresses"]["Row"],
  | "id"
  | "full_name"
  | "phone"
  | "country"
  | "governorate"
  | "wilayat"
  | "area"
  | "address_line_1"
  | "delivery_notes"
  | "is_default"
  | "created_at"
>;

export type CheckoutPrefill = {
  customer: CustomerProfile | null;
  address: CheckoutPrefillAddress | null;
  hasDefaultAddress: boolean;
  hasSavedAddress: boolean;
};

export async function getCheckoutPrefill(): Promise<CheckoutPrefill> {
  const customer = await getCurrentCustomer();

  if (!customer?.id) {
    return {
      customer,
      address: null,
      hasDefaultAddress: false,
      hasSavedAddress: false
    };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("addresses")
    .select("id,full_name,phone,country,governorate,wilayat,area,address_line_1,delivery_notes,is_default,created_at")
    .eq("customer_id", customer.id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .returns<CheckoutPrefillAddress[]>();

  if (error) {
    console.error("Failed to read checkout prefill address", error);
    return {
      customer,
      address: null,
      hasDefaultAddress: false,
      hasSavedAddress: false
    };
  }

  const address = data?.[0] ?? null;

  return {
    customer,
    address,
    hasDefaultAddress: Boolean(address?.is_default),
    hasSavedAddress: Boolean(address)
  };
}

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

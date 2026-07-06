import { requireAdmin } from "@/features/auth/queries";
import { createReadClient } from "@/features/supabase-read";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type StoreSettingsRow = Database["public"]["Tables"]["store_settings"]["Row"];

export type StoreSettingsRead = Pick<
  StoreSettingsRow,
  | "id"
  | "store_name"
  | "store_description"
  | "store_email"
  | "store_phone"
  | "store_name_ar"
  | "store_name_en"
  | "whatsapp_number"
  | "contact_phone"
  | "support_email"
  | "instagram_url"
  | "tiktok_url"
  | "logo_url"
  | "favicon_url"
  | "currency_code"
  | "currency_symbol"
  | "tax_rate"
  | "is_tax_enabled"
  | "is_store_open"
  | "maintenance_message"
  | "maintenance_message_ar"
  | "brand_story_ar"
  | "delivery_policy_ar"
  | "returns_policy_ar"
  | "default_meta_title_ar"
  | "default_meta_description_ar"
  | "order_prefix"
  | "minimum_order_amount"
>;

const settingsSelect =
  "id,store_name,store_description,store_email,store_phone,store_name_ar,store_name_en,whatsapp_number,contact_phone,support_email,instagram_url,tiktok_url,logo_url,favicon_url,currency_code,currency_symbol,tax_rate,is_tax_enabled,is_store_open,maintenance_message,maintenance_message_ar,brand_story_ar,delivery_policy_ar,returns_policy_ar,default_meta_title_ar,default_meta_description_ar,order_prefix,minimum_order_amount";

export async function getStoreSettings() {
  const supabase = await createReadClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("store_settings")
    .select(settingsSelect)
    .limit(1)
    .maybeSingle()
    .returns<StoreSettingsRead | null>();

  if (error) {
    console.error("Failed to read store settings", error);
    return null;
  }

  return data;
}

export async function getAdminStoreSettings() {
  const admin = await requireAdmin();

  if (!admin) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("store_settings")
    .select(settingsSelect)
    .limit(1)
    .maybeSingle()
    .returns<StoreSettingsRead | null>();

  if (error) {
    console.error("Failed to read admin store settings", error);
    return null;
  }

  return data;
}

export function getEffectiveStoreName(settings: StoreSettingsRead | null) {
  return settings?.store_name ?? settings?.store_name_ar ?? "عود ياز";
}

export function getEffectiveMaintenanceMessage(settings: StoreSettingsRead | null) {
  return (
    settings?.maintenance_message ??
    settings?.maintenance_message_ar ??
    "المتجر مغلق مؤقتا لاستقبال الطلبات الجديدة."
  );
}

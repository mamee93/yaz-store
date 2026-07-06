import { createReadClient } from "@/features/supabase-read";

export type StoreSettingsRead = {
  id: string;
  store_name_ar: string;
  store_name_en: string | null;
  whatsapp_number: string | null;
  contact_phone: string | null;
  support_email: string | null;
  instagram_url: string | null;
  brand_story_ar: string | null;
  delivery_policy_ar: string | null;
  returns_policy_ar: string | null;
  default_meta_title_ar: string | null;
  default_meta_description_ar: string | null;
  is_store_open: boolean;
};

export async function getStoreSettings() {
  const supabase = await createReadClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("store_settings")
    .select(
      "id,store_name_ar,store_name_en,whatsapp_number,contact_phone,support_email,instagram_url,brand_story_ar,delivery_policy_ar,returns_policy_ar,default_meta_title_ar,default_meta_description_ar,is_store_open"
    )
    .limit(1)
    .maybeSingle()
    .returns<StoreSettingsRead | null>();

  if (error) {
    console.error("Failed to read store settings", error);
    return null;
  }

  return data;
}

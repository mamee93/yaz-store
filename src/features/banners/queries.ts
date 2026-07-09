import { createReadClient } from "@/features/supabase-read";
import { requireAdminRole } from "@/features/auth/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import type { OfferPreview } from "@/components/storefront/offers-preview";
import type { Database } from "@/types/database";

export type BannerRow = Database["public"]["Tables"]["banners"]["Row"];

export type BannerRead = {
  id: string;
  title_ar: string;
  subtitle_ar: string | null;
  image_url: string;
  mobile_image_url: string | null;
  link_url: string | null;
  button_label_ar: string | null;
  placement: string;
  sort_order: number;
};

export async function getActiveBanners(placement?: string) {
  const supabase = await createReadClient();

  if (!supabase) {
    return [];
  }

  let query = supabase
    .from("banners")
    .select("id,title_ar,subtitle_ar,image_url,mobile_image_url,link_url,button_label_ar,placement,sort_order")
    .eq("is_active", true)
    .or(`starts_at.is.null,starts_at.lte.${new Date().toISOString()}`)
    .or(`ends_at.is.null,ends_at.gte.${new Date().toISOString()}`)
    .order("sort_order", { ascending: true });

  if (placement) {
    query = query.eq("placement", placement);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Failed to read banners", error);
    return [];
  }

  return (data ?? []) as BannerRead[];
}

export async function getAdminBanners() {
  const admin = await requireAdminRole(["owner", "manager"]);

  if (!admin) {
    return [];
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("banners")
    .select(
      "id,title_ar,title_en,subtitle_ar,subtitle_en,image_url,mobile_image_url,link_url,button_label_ar,button_label_en,placement,sort_order,is_active,starts_at,ends_at,created_at,updated_at"
    )
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })
    .returns<BannerRow[]>();

  if (error) {
    console.error("Failed to read admin banners", error);
    return [];
  }

  return data ?? [];
}

export function mapBannerToOffer(banner: BannerRead): OfferPreview {
  return {
    title: banner.title_ar,
    description: banner.subtitle_ar ?? "عرض مختار من عود ياز.",
    href: banner.link_url ?? "/offers",
    tone: `url("${banner.image_url}") center/cover`
  };
}

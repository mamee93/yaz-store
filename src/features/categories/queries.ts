import { createReadClient } from "@/features/supabase-read";
import { requireAdmin } from "@/features/auth/queries";
import { createClient } from "@/lib/supabase/server";
import type { FeaturedCategory } from "@/components/storefront/featured-categories";
import type { StoreCategory } from "@/components/storefront/static-catalog";

const fallbackCategoryTone = "linear-gradient(145deg, #3a2115, #8a6038)";

export type CategoryRead = {
  id: string;
  name_ar: string;
  name_en: string | null;
  slug: string;
  description_ar: string | null;
  description_en: string | null;
  image_url: string | null;
  sort_order: number;
  is_featured: boolean;
};

export type CategoryAdminRead = CategoryRead & {
  is_active: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  product_count: number;
};

type CategoryAdminRow = Omit<CategoryAdminRead, "product_count">;
type ProductCategoryIdRow = {
  category_id: string;
};

export async function getActiveCategories() {
  const supabase = await createReadClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("categories")
    .select("id,name_ar,name_en,slug,description_ar,description_en,image_url,sort_order,is_featured")
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Failed to read categories", error);
    return [];
  }

  return (data ?? []) as CategoryRead[];
}

export async function getActiveCategoryBySlug(slug: string) {
  const supabase = await createReadClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("categories")
    .select("id,name_ar,name_en,slug,description_ar,description_en,image_url,sort_order,is_featured")
    .eq("slug", slug)
    .eq("is_active", true)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    console.error("Failed to read category", error);
    return null;
  }

  return data as CategoryRead | null;
}

export async function getAdminCategories() {
  const admin = await requireAdmin();

  if (!admin) {
    return [];
  }

  const supabase = await createClient();
  const { data: categories, error: categoriesError } = await supabase
    .from("categories")
    .select(
      "id,name_ar,name_en,slug,description_ar,description_en,image_url,sort_order,is_active,is_featured,deleted_at,created_at,updated_at"
    )
    .is("deleted_at", null)
    .order("sort_order", { ascending: true })
    .returns<CategoryAdminRow[]>();

  if (categoriesError) {
    console.error("Failed to read admin categories", categoriesError);
    return [];
  }

  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("category_id")
    .is("deleted_at", null)
    .returns<ProductCategoryIdRow[]>();

  if (productsError) {
    console.error("Failed to read category product counts", productsError);
  }

  const productCounts = new Map<string, number>();

  for (const product of products ?? []) {
    productCounts.set(product.category_id, (productCounts.get(product.category_id) ?? 0) + 1);
  }

  return (categories ?? []).map((category) => ({
    ...category,
    product_count: productCounts.get(category.id) ?? 0
  }));
}

export function mapCategoryToStoreCategory(category: CategoryRead): StoreCategory {
  return {
    slug: category.slug,
    name: category.name_ar,
    description: category.description_ar ?? "مختارات فاخرة من عود ياز.",
    imageTone: toCssBackground(category.image_url) ?? fallbackCategoryTone
  };
}

export function mapCategoryToFeaturedCategory(category: CategoryRead): FeaturedCategory {
  return {
    href: `/categories/${category.slug}`,
    name: category.name_ar,
    description: category.description_ar ?? "مختارات فاخرة من عود ياز.",
    accent: toCssBackground(category.image_url) ?? fallbackCategoryTone
  };
}

function toCssBackground(url: string | null) {
  return url ? `url("${url}") center/cover` : null;
}

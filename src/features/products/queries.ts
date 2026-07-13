import { createReadClient } from "@/features/supabase-read";
import { requireAdmin } from "@/features/auth/queries";
import {
  getProductStockStatus,
  getStorefrontStockLabel
} from "@/features/inventory/stock-status";
import { createClient } from "@/lib/supabase/server";
import type { ProductPreview } from "@/components/storefront/product-preview-section";
import type { StoreProduct } from "@/components/storefront/static-catalog";

export type ProductImageRow = {
  id: string;
  product_id: string;
  image_url: string | null;
  public_url: string | null;
  storage_path: string;
  alt_text_ar: string | null;
  sort_order: number;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
};

type ProductCategoryRow = {
  name_ar: string;
  slug: string;
};

export type ProductRow = {
  id: string;
  category_id: string;
  name_ar: string;
  slug: string;
  short_description_ar: string | null;
  description_ar: string | null;
  price_omr: number;
  compare_at_price_omr: number | null;
  sku: string | null;
  stock_quantity: number;
  low_stock_threshold: number;
  track_stock: boolean;
  is_active: boolean;
  is_featured: boolean;
  is_best_seller: boolean;
  is_new_arrival: boolean;
  scent_family: string | null;
  intensity: string | null;
  usage_ar: string | null;
  occasion_ar: string | null;
  meta_title_ar: string | null;
  meta_description_ar: string | null;
  search_keywords_ar: string | null;
  weight_grams: number | null;
  volume_ml: number | null;
  sort_order: number;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  categories: ProductCategoryRow | null;
  product_images: ProductImageRow[] | null;
};

const productSelect = `
  id,
  category_id,
  name_ar,
  slug,
  short_description_ar,
  description_ar,
  price_omr,
  compare_at_price_omr,
  sku,
  stock_quantity,
  low_stock_threshold,
  track_stock,
  is_active,
  is_featured,
  is_best_seller,
  is_new_arrival,
  scent_family,
  intensity,
  usage_ar,
  occasion_ar,
  meta_title_ar,
  meta_description_ar,
  search_keywords_ar,
  weight_grams,
  volume_ml,
  sort_order,
  deleted_at,
  created_at,
  updated_at,
  categories(name_ar,slug),
  product_images(id,product_id,image_url,public_url,storage_path,alt_text_ar,sort_order,is_primary,created_at,updated_at)
`;

export async function getActiveProducts() {
  const supabase = await createReadClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("products")
    .select(productSelect)
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("sort_order", { ascending: true })
    .limit(500)
    .returns<ProductRow[]>();

  if (error) {
    console.error("Failed to read products", error);
    return [];
  }

  return data ?? [];
}

export async function getActiveProductsByCategorySlug(categorySlug: string) {
  const products = await getActiveProducts();
  return products.filter((product) => product.categories?.slug === categorySlug);
}

export async function getActiveProductBySlug(slug: string) {
  const supabase = await createReadClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("products")
    .select(productSelect)
    .eq("slug", slug)
    .eq("is_active", true)
    .is("deleted_at", null)
    .maybeSingle()
    .returns<ProductRow | null>();

  if (error) {
    console.error("Failed to read product", error);
    return null;
  }

  return data;
}

export async function getAdminProducts() {
  const admin = await requireAdmin();

  if (!admin) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(productSelect)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(500)
    .returns<ProductRow[]>();

  if (error) {
    console.error("Failed to read admin products", error);
    return [];
  }

  return data ?? [];
}

export async function getAdminProductById(productId: string) {
  const admin = await requireAdmin();

  if (!admin) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(productSelect)
    .eq("id", productId)
    .is("deleted_at", null)
    .maybeSingle()
    .returns<ProductRow | null>();

  if (error) {
    console.error("Failed to read admin product", error);
    return null;
  }

  return data;
}

export function mapProductToStoreProduct(product: ProductRow): StoreProduct {
  const productImages = getSortedProductImages(product.product_images);
  const primaryImage = productImages[0];
  const stockStatus = getProductStockStatus(product);
  const stockLabel = getStorefrontStockLabel(product);

  return {
    id: product.id,
    slug: product.slug,
    name: product.name_ar,
    categorySlug: product.categories?.slug ?? "products",
    categoryName: product.categories?.name_ar ?? "المنتجات",
    price: Number(product.price_omr),
    compareAtPrice: product.compare_at_price_omr
      ? Number(product.compare_at_price_omr)
      : undefined,
    label: product.categories?.name_ar ?? "منتج",
    shortDescription: product.short_description_ar ?? "منتج فاخر من عود ياز.",
    description: product.description_ar ?? product.short_description_ar ?? "منتج فاخر من عود ياز.",
    scentProfile: splitArabicList(product.scent_family, ["فاخر", "عربي", "هادئ"]),
    usage: splitArabicList(product.usage_ar, ["استخدم حسب الحاجة", "يحفظ بعيداً عن الحرارة"]),
    occasions: splitArabicList(product.occasion_ar, ["اليوميات", "الهدايا"]),
    sizeLabel: getProductMeasuredSizeLabel(product),
    intensity: product.intensity ?? "متوازن",
    stockLabel,
    canAddToCart: stockStatus !== "out_of_stock",
    imageTone: primaryImage
      ? `url("${primaryImage.url}") center/cover`
      : "linear-gradient(145deg, #361f14, #b88945)",
    imageUrl: primaryImage?.url,
    imageAlt: primaryImage?.alt ?? product.name_ar,
    images: productImages,
    badge: product.is_best_seller ? "الأكثر طلباً" : product.is_new_arrival ? "جديد" : undefined
  };
}

export function mapProductToPreview(product: ProductRow): ProductPreview {
  const storeProduct = mapProductToStoreProduct(product);

  return {
    name: storeProduct.name,
    href: `/products/${storeProduct.slug}`,
    price: storeProduct.price,
    label: storeProduct.label,
    imageTone: storeProduct.imageTone,
    imageUrl: storeProduct.imageUrl,
    imageAlt: storeProduct.imageAlt,
    badge: storeProduct.badge
  };
}

function getSortedProductImages(images: ProductImageRow[] | null) {
  if (!images?.length) {
    return [];
  }

  return [...images]
    .filter((image) => Boolean(image.image_url ?? image.public_url))
    .sort((a, b) => {
      if (a.is_primary && !b.is_primary) {
        return -1;
      }

      if (!a.is_primary && b.is_primary) {
        return 1;
      }

      return a.sort_order - b.sort_order;
    })
    .map((image) => ({
      id: image.id,
      url: (image.image_url ?? image.public_url) as string,
      alt: image.alt_text_ar ?? "ØµÙˆØ±Ø© Ø§Ù„Ù…Ù†ØªØ¬",
      isPrimary: image.is_primary
    }));
}

function getProductMeasuredSizeLabel(product: ProductRow) {
  if (product.volume_ml) {
    return `${product.volume_ml} مل`;
  }

  if (product.weight_grams) {
    return `${product.weight_grams} جم`;
  }

  return "منتج مختار";
}

function splitArabicList(value: string | null, fallback: string[]) {
  if (!value) {
    return fallback;
  }

  return value
    .split(/[،,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

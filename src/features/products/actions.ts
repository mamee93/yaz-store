"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logAdminActivity } from "@/features/admin-audit/log";
import { requireAdminRole } from "@/features/auth/queries";
import { notifyInventoryStatusTransition } from "@/features/inventory/notifications";
import { getProductImageFiles, uploadProductImageFiles } from "@/features/products/image-actions";
import { createClient } from "@/lib/supabase/server";
import { productSchema } from "@/validations/product-schema";
import type { Database } from "@/types/database";
import { createAdminClient } from "@/lib/supabase/admin";

type ProductInsert = Database["public"]["Tables"]["products"]["Insert"];
type ProductUpdate = Database["public"]["Tables"]["products"]["Update"];
type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

type CategorySlugRow = {
  slug: string;
};

type ProductPathRow = {
  id: string;
  slug: string;
  category_id: string;
  sku?: string | null;
  name_ar?: string;
  stock_quantity?: number;
  low_stock_threshold?: number;
  track_stock?: boolean;
};

type ProductSlugRow = {
  id: string;
  slug: string;
};



const adminProductsPath = "/admin/products";

export async function createProductAction(formData: FormData) {
  await assertAdmin();

  const parsed = productSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    redirectWithMessage(
      "/admin/products/new",
      "error",
      parsed.error.issues[0]?.message ?? "تعذر حفظ المنتج. تحقق من البيانات."
    );
  }

  const supabase = await createClient();
  const productValues = parsed.data;
  const requestedSlug = productValues.slug ?? slugifyProductName(productValues.name_ar);
  const sku = productValues.sku ?? (await generateNextSku());
  const payload: ProductInsert = {
    ...productValues,
    slug: await generateUniqueProductSlug(supabase, requestedSlug),
    sku
  };

  const { data, error } = await supabase
    .from("products")
    .insert(payload as never)
    .select("id,slug,category_id,name_ar,stock_quantity,low_stock_threshold,track_stock")
    .single()
    .returns<ProductPathRow>();

  if (error || !data) {
    redirectWithMessage(
      "/admin/products/new",
      "error",
      getProductErrorMessage(error?.code)
    );
  }

  const createdProduct = data as ProductPathRow;
  await notifyInventoryStatusTransition({
    before: {
      id: createdProduct.id,
      name_ar: createdProduct.name_ar ?? productValues.name_ar,
      stock_quantity: Number.MAX_SAFE_INTEGER,
      low_stock_threshold: createdProduct.low_stock_threshold ?? productValues.low_stock_threshold,
      track_stock: createdProduct.track_stock ?? productValues.track_stock
    },
    after: {
      id: createdProduct.id,
      name_ar: createdProduct.name_ar ?? productValues.name_ar,
      stock_quantity: createdProduct.stock_quantity ?? productValues.stock_quantity,
      low_stock_threshold: createdProduct.low_stock_threshold ?? productValues.low_stock_threshold,
      track_stock: createdProduct.track_stock ?? productValues.track_stock
    }
  });
  const imageFiles = await getProductImageFiles(formData);

  if (imageFiles.length > 0) {
    const imageUpload = await uploadProductImageFiles(createdProduct.id, imageFiles);

    if (!imageUpload.ok) {
      redirectWithMessage(
        `/admin/products/${createdProduct.id}/edit`,
        "error",
        `تم إنشاء المنتج لكن تعذر رفع الصور: ${imageUpload.error}`
      );
    }
  }

  await revalidateProductPaths(createdProduct.slug, createdProduct.category_id);
  redirectWithMessage(
    `/admin/products/${createdProduct.id}/edit`,
    "success",
    "تم إنشاء المنتج بنجاح."
  );
}

export async function updateProductAction(productId: string, formData: FormData) {
  await assertAdmin();

  const parsed = productSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    redirectWithMessage(
      `/admin/products/${productId}/edit`,
      "error",
      parsed.error.issues[0]?.message ?? "تعذر تحديث المنتج. تحقق من البيانات."
    );
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("products")
    .select("id,slug,category_id,sku,name_ar,stock_quantity,low_stock_threshold,track_stock")
    .eq("id", productId)
    .is("deleted_at", null)
    .maybeSingle()
    .returns<ProductPathRow | null>();

  if (!existing) {
    redirectWithMessage(`/admin/products/${productId}/edit`, "error", "\u0627\u0644\u0645\u0646\u062A\u062C \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F \u0623\u0648 \u062A\u0645 \u062D\u0630\u0641\u0647 \u0645\u0633\u0628\u0642\u0627.");
  }

  const productValues = parsed.data;
  const requestedSlug = productValues.slug ?? existing.slug;
  const payload: ProductUpdate = {
    ...productValues,
    slug:
      requestedSlug === existing.slug
        ? existing.slug
        : await generateUniqueProductSlug(supabase, requestedSlug, productId),
    sku: existing.sku
  };

  const { error } = await supabase
    .from("products")
    .update(payload as never)
    .eq("id", productId)
    .is("deleted_at", null);

  if (error) {
    redirectWithMessage(
      `/admin/products/${productId}/edit`,
      "error",
      getProductErrorMessage(error.code)
    );
  }

  await notifyInventoryStatusTransition({
    before: {
      id: existing.id,
      name_ar: existing.name_ar ?? productValues.name_ar,
      stock_quantity: existing.stock_quantity ?? 0,
      low_stock_threshold: existing.low_stock_threshold ?? 0,
      track_stock: existing.track_stock ?? true
    },
    after: {
      id: existing.id,
      name_ar: productValues.name_ar,
      stock_quantity: productValues.stock_quantity,
      low_stock_threshold: productValues.low_stock_threshold,
      track_stock: productValues.track_stock
    }
  });

  await revalidateProductPaths(payload.slug, payload.category_id);

  if (existing) {
    await revalidateProductPaths(existing.slug, existing.category_id);
  }

  redirectWithMessage(
    `/admin/products/${productId}/edit`,
    "success",
    "تم تحديث المنتج بنجاح."
  );
}

export async function softDeleteProductAction(productId: string) {
  const owner = await assertOwner();

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("products")
    .select("id,slug,category_id,name_ar")
    .eq("id", productId)
    .is("deleted_at", null)
    .maybeSingle()
    .returns<ProductPathRow | null>();

  if (!existing) {
    redirectWithMessage(adminProductsPath, "error", "المنتج غير موجود أو تم حذفه مسبقا.");
  }

  const { error } = await supabase
    .from("products")
    .update({ deleted_at: new Date().toISOString(), is_active: false } as never)
    .eq("id", productId)
    .is("deleted_at", null);

  if (error) {
    redirectWithMessage(adminProductsPath, "error", "تعذر حذف المنتج.");
  }

  await logAdminActivity({
    admin: owner,
    action: "product.disable",
    entityType: "product",
    entityId: existing.id,
    description: `تم تعطيل المنتج ${existing.name_ar ?? existing.slug} بدلا من حذفه`,
    metadata: { slug: existing.slug, category_id: existing.category_id }
  });
  await revalidateProductPaths(existing.slug, existing.category_id);

  redirectWithMessage(adminProductsPath, "success", "تم حذف المنتج بنجاح.");
}

async function assertAdmin() {
  const admin = await requireAdminRole(["owner", "manager"]);

  if (!admin) {
    redirect("/admin?status=error&message=ليست لديك صلاحية لإدارة المنتجات.");
  }
}

async function assertOwner() {
  const admin = await requireAdminRole(["owner"]);

  if (!admin) {
    redirect("/admin/products?status=error&message=الحذف متاح للمالك فقط.");
  }

  return admin;
}

async function revalidateProductPaths(productSlug?: string | null, categoryId?: string | null) {
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath(adminProductsPath);

  if (productSlug) {
    revalidatePath(`/products/${productSlug}`);
  }

  if (categoryId) {
    const categorySlug = await getCategorySlug(categoryId);

    if (categorySlug) {
      revalidatePath(`/categories/${categorySlug}`);
    }
  }
}

async function getCategorySlug(categoryId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("slug")
    .eq("id", categoryId)
    .maybeSingle()
    .returns<CategorySlugRow | null>();

  return data?.slug ?? null;
}

async function generateUniqueProductSlug(
  supabase: SupabaseServerClient,
  requestedSlug: string,
  excludeProductId?: string
) {
  const baseSlug = normalizeSlug(requestedSlug);
  let candidate = baseSlug;
  let suffix = 2;

  while (await productSlugExists(supabase, candidate, excludeProductId)) {
    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

async function productSlugExists(
  supabase: SupabaseServerClient,
  slug: string,
  excludeProductId?: string
) {
  let query = supabase
    .from("products")
    .select("id,slug")
    .eq("slug", slug)
    .limit(1);

  if (excludeProductId) {
    query = query.neq("id", excludeProductId);
  }

  const { data, error } = await query.returns<ProductSlugRow[]>();

  if (error) {
    throw new Error("Failed to check product slug availability");
  }

  return (data?.length ?? 0) > 0;
}

async function generateNextSku() {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient.rpc("generate_product_sku");

  if (error || typeof data !== "string") {
    console.error("Failed to generate product SKU", error);
    throw new Error("Failed to generate product SKU");
  }

  return data;
}
 

function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-") || "product";
}

function slugifyProductName(value: string) {
  const arabicSlugMap: Record<string, string> = {
    "\u0621": "",
    "\u0622": "a",
    "\u0623": "a",
    "\u0624": "w",
    "\u0625": "i",
    "\u0626": "y",
    "\u0627": "a",
    "\u0628": "b",
    "\u0629": "h",
    "\u062A": "t",
    "\u062B": "th",
    "\u062C": "j",
    "\u062D": "h",
    "\u062E": "kh",
    "\u062F": "d",
    "\u0630": "dh",
    "\u0631": "r",
    "\u0632": "z",
    "\u0633": "s",
    "\u0634": "sh",
    "\u0635": "s",
    "\u0636": "d",
    "\u0637": "t",
    "\u0638": "z",
    "\u0639": "a",
    "\u063A": "gh",
    "\u0641": "f",
    "\u0642": "q",
    "\u0643": "k",
    "\u0644": "l",
    "\u0645": "m",
    "\u0646": "n",
    "\u0647": "h",
    "\u0648": "w",
    "\u0649": "a",
    "\u064A": "y"
  };
  const transliterated = Array.from(value.normalize("NFKD"))
    .map((character) => arabicSlugMap[character] ?? character)
    .join("")
    .replace(/[\u064B-\u065F\u0670]/g, "");

  return normalizeSlug(transliterated);
}

function redirectWithMessage(path: string, status: "success" | "error", message: string): never {
  const params = new URLSearchParams({ status, message });
  redirect(`${path}?${params.toString()}`);
}

function getProductErrorMessage(code?: string) {
  if (code === "23505") {
    return "الرابط المختصر أو SKU مستخدم مسبقاً.";
  }

  if (code === "23503") {
    return "التصنيف المحدد غير صحيح.";
  }

  return "تعذر حفظ المنتج. حاول مرة أخرى.";
}

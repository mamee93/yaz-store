"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminRole } from "@/features/auth/queries";
import { createClient } from "@/lib/supabase/server";
import { productSchema } from "@/validations/product-schema";
import type { Database } from "@/types/database";

type ProductInsert = Database["public"]["Tables"]["products"]["Insert"];
type ProductUpdate = Database["public"]["Tables"]["products"]["Update"];

type CategorySlugRow = {
  slug: string;
};

type ProductPathRow = {
  id: string;
  slug: string;
  category_id: string;
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
  const payload = parsed.data as ProductInsert;

  const { data, error } = await supabase
    .from("products")
    .insert(payload as never)
    .select("id,slug,category_id")
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
    .select("id,slug,category_id")
    .eq("id", productId)
    .is("deleted_at", null)
    .maybeSingle()
    .returns<ProductPathRow | null>();

  const payload = parsed.data as ProductUpdate;
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
  await assertOwner();

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("products")
    .select("id,slug,category_id")
    .eq("id", productId)
    .is("deleted_at", null)
    .maybeSingle()
    .returns<ProductPathRow | null>();

  const { error } = await supabase
    .from("products")
    .update({ deleted_at: new Date().toISOString(), is_active: false } as never)
    .eq("id", productId)
    .is("deleted_at", null);

  if (error) {
    redirectWithMessage(adminProductsPath, "error", "تعذر حذف المنتج.");
  }

  if (existing) {
    await revalidateProductPaths(existing.slug, existing.category_id);
  }

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

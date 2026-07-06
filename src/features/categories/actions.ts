"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/features/auth/queries";
import { createClient } from "@/lib/supabase/server";
import { categorySchema } from "@/validations/category-schema";
import type { Database } from "@/types/database";

type CategoryInsert = Database["public"]["Tables"]["categories"]["Insert"];
type CategoryUpdate = Database["public"]["Tables"]["categories"]["Update"];
type CategorySlugRow = {
  slug: string;
};

const adminCategoriesPath = "/admin/categories";

export async function createCategoryAction(formData: FormData) {
  await assertAdmin();

  const parsed = categorySchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    redirectWithMessage(
      adminCategoriesPath,
      "error",
      parsed.error.issues[0]?.message ?? "تعذر حفظ التصنيف. تحقق من البيانات."
    );
  }

  const supabase = await createClient();
  const payload = parsed.data as CategoryInsert;
  const { error } = await supabase.from("categories").insert(payload as never);

  if (error) {
    redirectWithMessage(adminCategoriesPath, "error", getCategoryErrorMessage(error.code));
  }

  revalidateCategoryPaths(payload.slug);
  redirectWithMessage(adminCategoriesPath, "success", "تم إنشاء التصنيف بنجاح.");
}

export async function updateCategoryAction(categoryId: string, formData: FormData) {
  await assertAdmin();

  const parsed = categorySchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    redirectWithMessage(
      adminCategoriesPath,
      "error",
      parsed.error.issues[0]?.message ?? "تعذر تحديث التصنيف. تحقق من البيانات."
    );
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("categories")
    .select("slug")
    .eq("id", categoryId)
    .is("deleted_at", null)
    .maybeSingle()
    .returns<CategorySlugRow | null>();

  const payload = parsed.data as CategoryUpdate;
  const { error } = await supabase
    .from("categories")
    .update(payload as never)
    .eq("id", categoryId)
    .is("deleted_at", null);

  if (error) {
    redirectWithMessage(adminCategoriesPath, "error", getCategoryErrorMessage(error.code));
  }

  revalidateCategoryPaths(payload.slug);

  if (existing?.slug) {
    revalidateCategoryPaths(existing.slug);
  }

  redirectWithMessage(adminCategoriesPath, "success", "تم تحديث التصنيف بنجاح.");
}

export async function softDeleteCategoryAction(categoryId: string) {
  await assertAdmin();

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("categories")
    .select("slug")
    .eq("id", categoryId)
    .is("deleted_at", null)
    .maybeSingle()
    .returns<CategorySlugRow | null>();

  const { error } = await supabase
    .from("categories")
    .update({ deleted_at: new Date().toISOString(), is_active: false } as never)
    .eq("id", categoryId)
    .is("deleted_at", null);

  if (error) {
    redirectWithMessage(adminCategoriesPath, "error", "تعذر حذف التصنيف.");
  }

  if (existing?.slug) {
    revalidateCategoryPaths(existing.slug);
  }

  redirectWithMessage(adminCategoriesPath, "success", "تم حذف التصنيف بنجاح.");
}

async function assertAdmin() {
  const admin = await requireAdmin();

  if (!admin) {
    redirect("/login");
  }
}

function revalidateCategoryPaths(categorySlug?: string | null) {
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath(adminCategoriesPath);
  revalidatePath("/admin/products");

  if (categorySlug) {
    revalidatePath(`/categories/${categorySlug}`);
  }
}

function redirectWithMessage(path: string, status: "success" | "error", message: string): never {
  const params = new URLSearchParams({ status, message });
  redirect(`${path}?${params.toString()}`);
}

function getCategoryErrorMessage(code?: string) {
  if (code === "23505") {
    return "الرابط المختصر مستخدم مسبقاً.";
  }

  return "تعذر حفظ التصنيف. حاول مرة أخرى.";
}

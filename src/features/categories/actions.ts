"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminRole } from "@/features/auth/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { categorySchema } from "@/validations/category-schema";
import type { Database } from "@/types/database";

type CategoryInsert = Database["public"]["Tables"]["categories"]["Insert"];
type CategoryUpdate = Database["public"]["Tables"]["categories"]["Update"];
type CategorySlugRow = {
  slug: string;
  image_url?: string | null;
};

const adminCategoriesPath = "/admin/categories";
const categoryImagesBucket = "category-images";
const legacyCategoryImageBuckets = ["categories", "category", "category-image", "category_images"];
const maxCategoryImageSize = 5 * 1024 * 1024;
const allowedCategoryImageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/svg+xml"]);

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

  const file = getImageFile(formData.get("image"));
  const payload = parsed.data as CategoryInsert;
  let uploadedImagePath: string | null = null;

  if (file) {
    const validationError = validateCategoryImage(file);

    if (validationError) {
      redirectWithMessage(adminCategoriesPath, "error", validationError);
    }

    const uploadedImage = await uploadCategoryImage(file);
    payload.image_url = uploadedImage.publicUrl;
    uploadedImagePath = uploadedImage.storagePath;
  }

  const supabase = await createClient();
  const { error } = await supabase.from("categories").insert(payload as never);

  if (error) {
    if (uploadedImagePath) {
      await deleteCategoryImageByPath(uploadedImagePath);
    }

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
    .select("slug,image_url")
    .eq("id", categoryId)
    .is("deleted_at", null)
    .maybeSingle()
    .returns<CategorySlugRow | null>();

  const file = getImageFile(formData.get("image"));
  const payload = parsed.data as CategoryUpdate;

  let uploadedImagePath: string | null = null;

  if (file) {
    const validationError = validateCategoryImage(file);

    if (validationError) {
      redirectWithMessage(adminCategoriesPath, "error", validationError);
    }

    const uploadedImage = await uploadCategoryImage(file, categoryId);
    payload.image_url = uploadedImage.publicUrl;
    uploadedImagePath = uploadedImage.storagePath;
  } else {
    payload.image_url = normalizeCategoryImageUrl(existing?.image_url);
  }

  const { error } = await supabase
    .from("categories")
    .update(payload as never)
    .eq("id", categoryId)
    .is("deleted_at", null);

  if (error) {
    if (uploadedImagePath) {
      await deleteCategoryImageByPath(uploadedImagePath);
    }

    redirectWithMessage(adminCategoriesPath, "error", getCategoryErrorMessage(error.code));
  }

  if (uploadedImagePath && existing?.image_url) {
    await deleteCategoryImageByUrl(existing.image_url);
  }

  revalidateCategoryPaths(payload.slug);

  if (existing?.slug) {
    revalidateCategoryPaths(existing.slug);
  }

  redirectWithMessage(adminCategoriesPath, "success", "تم تحديث التصنيف بنجاح.");
}

export async function softDeleteCategoryAction(categoryId: string) {
  await assertOwner();

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
  const admin = await requireAdminRole(["owner", "manager"]);

  if (!admin) {
    redirect("/admin?status=error&message=ليست لديك صلاحية لإدارة التصنيفات.");
  }
}

async function assertOwner() {
  const admin = await requireAdminRole(["owner"]);

  if (!admin) {
    redirect("/admin/categories?status=error&message=الحذف متاح للمالك فقط.");
  }
}

function getImageFile(value: FormDataEntryValue | null) {
  return value instanceof File && value.size > 0 ? value : null;
}

function validateCategoryImage(file: File) {
  if (!allowedCategoryImageTypes.has(file.type)) {
    return "نوع الصورة غير مدعوم. الصيغ المسموحة: JPG, PNG, WEBP, SVG.";
  }

  if (file.size > maxCategoryImageSize) {
    return "حجم صورة التصنيف يجب ألا يتجاوز 5MB.";
  }

  return null;
}

async function uploadCategoryImage(file: File, categoryId = crypto.randomUUID()) {
  const supabase = createAdminClient();
  const storagePath = `categories/${categoryId}/${crypto.randomUUID()}.${getImageExtension(file)}`;
  const { error } = await supabase.storage.from(categoryImagesBucket).upload(storagePath, file, {
    cacheControl: "31536000",
    contentType: file.type,
    upsert: false
  });

  if (error) {
    redirectWithMessage(adminCategoriesPath, "error", "تعذر رفع صورة التصنيف. تحقق من bucket category-images.");
  }

  const { data } = supabase.storage.from(categoryImagesBucket).getPublicUrl(storagePath);
  return { publicUrl: normalizeCategoryImageUrl(data.publicUrl) ?? data.publicUrl, storagePath };
}

async function deleteCategoryImageByUrl(url?: string | null) {
  const path = getCategoryImagePathFromUrl(url);

  if (path) {
    await deleteCategoryImageByPath(path);
  }
}

async function deleteCategoryImageByPath(path: string) {
  const supabase = createAdminClient();
  await supabase.storage.from(categoryImagesBucket).remove([path]);
}

function getCategoryImagePathFromUrl(url?: string | null) {
  if (!url) {
    return null;
  }

  for (const bucketName of [categoryImagesBucket, ...legacyCategoryImageBuckets]) {
    const marker = `/storage/v1/object/public/${bucketName}/`;
    const markerIndex = url.indexOf(marker);

    if (markerIndex !== -1) {
      const pathWithQuery = url.slice(markerIndex + marker.length);
      return decodeURIComponent(pathWithQuery.split("?")[0] ?? "");
    }
  }

  return null;
}

function normalizeCategoryImageUrl(url?: string | null) {
  if (!url) {
    return null;
  }

  return legacyCategoryImageBuckets.reduce(
    (normalizedUrl, bucketName) =>
      normalizedUrl.replace(
        `/storage/v1/object/public/${bucketName}/`,
        `/storage/v1/object/public/${categoryImagesBucket}/`
      ),
    url
  );
}

function getImageExtension(file: File) {
  if (file.type === "image/png") {
    return "png";
  }

  if (file.type === "image/webp") {
    return "webp";
  }

  if (file.type === "image/svg+xml") {
    return "svg";
  }

  return "jpg";
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

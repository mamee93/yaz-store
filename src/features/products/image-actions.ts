"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminRole } from "@/features/auth/queries";
import { createAdminClient } from "@/lib/supabase/admin";

const bucketName = "product-images";
const maxImageSize = 5 * 1024 * 1024;
const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

type ProductPathRow = {
  id: string;
  slug: string;
  category_id: string;
  categories: {
    slug: string;
  } | null;
};

type ProductImagePathRow = {
  id: string;
  product_id: string;
  storage_path: string;
  is_primary: boolean;
};

type ProductImageCountRow = {
  id: string;
};

export async function uploadProductImagesAction(productId: string, formData: FormData) {
  await assertAdmin();

  const files = formData
    .getAll("images")
    .filter((file): file is File => file instanceof File && file.size > 0);

  if (files.length === 0) {
    redirectWithMessage(productId, "error", "اختر صورة واحدة على الأقل.");
  }

  for (const file of files) {
    const validationError = validateImage(file);

    if (validationError) {
      redirectWithMessage(productId, "error", validationError);
    }
  }

  const supabase = createAdminClient();
  const product = await getProductPath(productId);

  if (!product) {
    redirectWithMessage(productId, "error", "المنتج غير موجود.");
  }

  const existingImages = await getProductImageCount(productId);
  const uploadedPaths: string[] = [];

  for (const [index, file] of files.entries()) {
    const storagePath = `products/${productId}/${crypto.randomUUID()}.${getImageExtension(file)}`;
    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(storagePath, file, {
        cacheControl: "31536000",
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      await cleanupUploadedPaths(uploadedPaths);
      redirectWithMessage(productId, "error", "تعذر رفع الصورة. تحقق من إعدادات التخزين.");
    }

    uploadedPaths.push(storagePath);
    const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(storagePath);
    const isPrimary = existingImages.length === 0 && index === 0;

    const { error: insertError } = await supabase.from("product_images").insert({
      product_id: productId,
      storage_path: storagePath,
      public_url: publicUrlData.publicUrl,
      alt_text_ar: product.name_ar,
      sort_order: existingImages.length + index,
      is_primary: isPrimary
    } as never);

    if (insertError) {
      await cleanupUploadedPaths(uploadedPaths);
      redirectWithMessage(productId, "error", "تم رفع الصورة لكن تعذر حفظها في المنتج.");
    }
  }

  await revalidateProductImagePaths(product);
  redirectWithMessage(productId, "success", "تم رفع الصور بنجاح.");
}

export async function deleteProductImageAction(imageId: string) {
  await assertAdmin();

  const supabase = createAdminClient();
  const image = await getProductImage(imageId);

  if (!image) {
    redirect("/admin/products");
  }

  const product = await getProductPath(image.product_id);

  const { error: storageError } = await supabase.storage
    .from(bucketName)
    .remove([image.storage_path]);

  if (storageError) {
    redirectWithMessage(image.product_id, "error", "تعذر حذف الصورة من التخزين.");
  }

  const { error: deleteError } = await supabase
    .from("product_images")
    .delete()
    .eq("id", image.id);

  if (deleteError) {
    redirectWithMessage(image.product_id, "error", "تعذر حذف الصورة من المنتج.");
  }

  if (image.is_primary) {
    await promoteNextPrimaryImage(image.product_id);
  }

  if (product) {
    await revalidateProductImagePaths(product);
  }

  redirectWithMessage(image.product_id, "success", "تم حذف الصورة بنجاح.");
}

export async function setPrimaryProductImageAction(imageId: string) {
  await assertAdmin();

  const image = await getProductImage(imageId);

  if (!image) {
    redirect("/admin/products");
  }

  const supabase = createAdminClient();
  const { error: resetError } = await supabase
    .from("product_images")
    .update({ is_primary: false } as never)
    .eq("product_id", image.product_id);

  if (resetError) {
    redirectWithMessage(image.product_id, "error", "تعذر تحديث الصورة الأساسية.");
  }

  const { error: primaryError } = await supabase
    .from("product_images")
    .update({ is_primary: true } as never)
    .eq("id", image.id);

  if (primaryError) {
    redirectWithMessage(image.product_id, "error", "تعذر تحديث الصورة الأساسية.");
  }

  const product = await getProductPath(image.product_id);

  if (product) {
    await revalidateProductImagePaths(product);
  }

  redirectWithMessage(image.product_id, "success", "تم تعيين الصورة الأساسية.");
}

async function assertAdmin() {
  const admin = await requireAdminRole(["owner", "manager"]);

  if (!admin) {
    redirect("/admin?status=error&message=ليست لديك صلاحية لإدارة صور المنتجات.");
  }
}

function validateImage(file: File) {
  if (!allowedImageTypes.has(file.type)) {
    return "نوع الصورة غير مدعوم. الصيغ المسموحة: JPG, PNG, WEBP.";
  }

  if (file.size > maxImageSize) {
    return "حجم الصورة يجب ألا يتجاوز 5MB.";
  }

  return null;
}

function getImageExtension(file: File) {
  if (file.type === "image/png") {
    return "png";
  }

  if (file.type === "image/webp") {
    return "webp";
  }

  return "jpg";
}

async function getProductPath(productId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("products")
    .select("id,slug,category_id,name_ar,categories(slug)")
    .eq("id", productId)
    .is("deleted_at", null)
    .maybeSingle()
    .returns<(ProductPathRow & { name_ar: string }) | null>();

  return data;
}

async function getProductImage(imageId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("product_images")
    .select("id,product_id,storage_path,is_primary")
    .eq("id", imageId)
    .maybeSingle()
    .returns<ProductImagePathRow | null>();

  return data;
}

async function getProductImageCount(productId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("product_images")
    .select("id")
    .eq("product_id", productId)
    .returns<ProductImageCountRow[]>();

  return data ?? [];
}

async function promoteNextPrimaryImage(productId: string) {
  const supabase = createAdminClient();
  const { data: nextImage } = await supabase
    .from("product_images")
    .select("id")
    .eq("product_id", productId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle()
    .returns<ProductImageCountRow | null>();

  if (!nextImage) {
    return;
  }

  await supabase
    .from("product_images")
    .update({ is_primary: true } as never)
    .eq("id", nextImage.id);
}

async function cleanupUploadedPaths(paths: string[]) {
  if (paths.length === 0) {
    return;
  }

  const supabase = createAdminClient();
  await supabase.storage.from(bucketName).remove(paths);
}

async function revalidateProductImagePaths(product: ProductPathRow) {
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${product.id}/edit`);
  revalidatePath(`/products/${product.slug}`);

  if (product.categories?.slug) {
    revalidatePath(`/categories/${product.categories.slug}`);
  }
}

function redirectWithMessage(productId: string, status: "success" | "error", message: string): never {
  const params = new URLSearchParams({ status, message });
  redirect(`/admin/products/${productId}/edit?${params.toString()}`);
}

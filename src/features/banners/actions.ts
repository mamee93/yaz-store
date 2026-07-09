"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminRole } from "@/features/auth/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import { bannerSchema } from "@/validations/banner-schema";
import type { Database } from "@/types/database";

const bucketName = "banner-images";
const maxBannerImageSize = 5 * 1024 * 1024;
const allowedBannerImageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/svg+xml"]);
const adminBannersPath = "/admin/banners";

export async function createBannerAction(formData: FormData) {
  await assertBannerAdmin();
  const parsed = bannerSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    redirectWithMessage("error", parsed.error.issues[0]?.message ?? "تعذر حفظ البنر.");
  }

  const file = getImageFile(formData.get("image"));

  if (!file) {
    redirectWithMessage("error", "اختر صورة للبنر.");
  }

  const validationError = validateBannerImage(file);

  if (validationError) {
    redirectWithMessage("error", validationError);
  }

  const supabase = createAdminClient();
  const imageUrl = await uploadBannerImage(file);

  const { error } = await supabase.from("banners").insert({
    ...parsed.data,
    image_url: imageUrl
  } as Database["public"]["Tables"]["banners"]["Insert"] as never);

  if (error) {
    redirectWithMessage("error", "تعذر إنشاء البنر. تحقق من البيانات أو التخزين.");
  }

  revalidateBannerPaths();
  redirectWithMessage("success", "تم إنشاء البنر بنجاح.");
}

export async function updateBannerAction(bannerId: string, formData: FormData) {
  await assertBannerAdmin();
  const parsed = bannerSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    redirectWithMessage("error", parsed.error.issues[0]?.message ?? "تعذر تحديث البنر.");
  }

  const file = getImageFile(formData.get("image"));
  const updatePayload: Database["public"]["Tables"]["banners"]["Update"] = {
    ...parsed.data
  };

  if (file) {
    const validationError = validateBannerImage(file);

    if (validationError) {
      redirectWithMessage("error", validationError);
    }

    updatePayload.image_url = await uploadBannerImage(file, bannerId);
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("banners")
    .update(updatePayload as never)
    .eq("id", bannerId);

  if (error) {
    redirectWithMessage("error", "تعذر تحديث البنر. حاول مرة أخرى.");
  }

  revalidateBannerPaths();
  redirectWithMessage("success", "تم تحديث البنر بنجاح.");
}

export async function toggleBannerStatusAction(bannerId: string, isActive: boolean) {
  await assertBannerAdmin();

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("banners")
    .update({ is_active: isActive } as never)
    .eq("id", bannerId);

  if (error) {
    redirectWithMessage("error", "تعذر تحديث حالة البنر.");
  }

  revalidateBannerPaths();
  redirectWithMessage("success", isActive ? "تم تفعيل البنر." : "تم إيقاف البنر.");
}

async function assertBannerAdmin() {
  const admin = await requireAdminRole(["owner", "manager"]);

  if (!admin) {
    redirect("/admin?status=error&message=ليست لديك صلاحية لإدارة البنرات.");
  }
}

function getImageFile(value: FormDataEntryValue | null) {
  return value instanceof File && value.size > 0 ? value : null;
}

function validateBannerImage(file: File) {
  if (!allowedBannerImageTypes.has(file.type)) {
    return "نوع الصورة غير مدعوم. الصيغ المسموحة: JPG, PNG, WEBP, SVG.";
  }

  if (file.size > maxBannerImageSize) {
    return "حجم صورة البنر يجب ألا يتجاوز 5MB.";
  }

  return null;
}

async function uploadBannerImage(file: File, bannerId = crypto.randomUUID()) {
  const supabase = createAdminClient();
  const storagePath = `banners/${bannerId}/${crypto.randomUUID()}.${getImageExtension(file)}`;
  const { error } = await supabase.storage.from(bucketName).upload(storagePath, file, {
    cacheControl: "31536000",
    contentType: file.type,
    upsert: false
  });

  if (error) {
    redirectWithMessage("error", "تعذر رفع صورة البنر. تحقق من bucket banner-images.");
  }

  const { data } = supabase.storage.from(bucketName).getPublicUrl(storagePath);
  return data.publicUrl;
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

function revalidateBannerPaths() {
  revalidatePath("/");
  revalidatePath("/offers");
  revalidatePath("/admin/banners");
}

function redirectWithMessage(status: "success" | "error", message: string): never {
  const params = new URLSearchParams({ status, message });
  redirect(`${adminBannersPath}?${params.toString()}`);
}

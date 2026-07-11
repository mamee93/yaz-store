"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logAdminActivity } from "@/features/admin-audit/log";
import { requireAdminRole } from "@/features/auth/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import { bannerSchema } from "@/validations/banner-schema";
import type { AdminProfile } from "@/features/auth/queries";
import type { Database } from "@/types/database";

type BannerForDelete = Pick<
  Database["public"]["Tables"]["banners"]["Row"],
  "id" | "title_ar" | "image_url" | "mobile_image_url" | "placement"
>;

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
    console.error("createBannerAction failed", error);
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
    console.error("updateBannerAction failed", error);
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
    console.error("toggleBannerStatusAction failed", error);
    redirectWithMessage("error", "تعذر تحديث حالة البنر.");
  }

  revalidateBannerPaths();
  redirectWithMessage("success", isActive ? "تم تفعيل البنر." : "تم إيقاف البنر.");
}

export async function deleteBannerAction(bannerId: string) {
  const admin = await assertBannerAdmin();
  const supabase = createAdminClient();
  const { data: banner, error: readError } = await supabase
    .from("banners")
    .select("id,title_ar,image_url,mobile_image_url,placement")
    .eq("id", bannerId)
    .maybeSingle()
    .returns<BannerForDelete | null>();

  if (readError || !banner) {
    console.error("deleteBannerAction read failed", readError);
    redirectWithMessage("error", "البنر غير موجود أو تعذر قراءته.");
  }

  const { error } = await supabase.from("banners").delete().eq("id", banner.id);

  if (error) {
    console.error("deleteBannerAction failed", error);
    redirectWithMessage("error", "تعذر حذف البنر. حاول مرة أخرى.");
  }

  await Promise.all([
    removeBannerImageIfUnused(banner.image_url, banner.id),
    removeBannerImageIfUnused(banner.mobile_image_url, banner.id)
  ]);

  await logAdminActivity({
    admin,
    action: "banner.delete",
    entityType: "banner",
    entityId: banner.id,
    description: `تم حذف البنر ${banner.title_ar}`,
    metadata: {
      placement: banner.placement
    }
  });

  revalidateBannerPaths();
  redirectWithMessage("success", "تم حذف البنر بنجاح.");
}

async function assertBannerAdmin(): Promise<AdminProfile> {
  const admin = await requireAdminRole(["owner", "manager"]);

  if (!admin) {
    redirect("/admin?status=error&message=ليست لديك صلاحية لإدارة البنرات.");
  }

  return admin;
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
    console.error("uploadBannerImage failed", error);
    redirectWithMessage("error", "تعذر رفع صورة البنر. تحقق من bucket banner-images.");
  }

  const { data } = supabase.storage.from(bucketName).getPublicUrl(storagePath);
  return data.publicUrl;
}

async function removeBannerImageIfUnused(url: string | null, deletedBannerId: string) {
  const path = getBannerStoragePath(url);

  if (!path) {
    return;
  }

  try {
    const supabase = createAdminClient();
    const { count, error: countError } = await supabase
      .from("banners")
      .select("id", { count: "exact", head: true })
      .neq("id", deletedBannerId)
      .or(`image_url.eq.${url},mobile_image_url.eq.${url}`);

    if (countError) {
      console.warn("Could not verify shared banner image before deletion", countError);
      return;
    }

    if ((count ?? 0) > 0) {
      return;
    }

    const { error } = await supabase.storage.from(bucketName).remove([path]);

    if (error) {
      console.warn("Failed to remove banner image from storage", error);
    }
  } catch (error) {
    console.warn("Failed to cleanup banner image", error);
  }
}

function getBannerStoragePath(url?: string | null) {
  if (!url) {
    return null;
  }

  const marker = `/storage/v1/object/public/${bucketName}/`;
  const markerIndex = url.indexOf(marker);

  if (markerIndex === -1) {
    return null;
  }

  const pathWithQuery = url.slice(markerIndex + marker.length);
  return decodeURIComponent(pathWithQuery.split("?")[0] ?? "");
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

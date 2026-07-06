"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomUUID } from "crypto";
import { requireAdmin } from "@/features/auth/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import { storeSettingsSchema } from "@/validations/store-settings-schema";
import type { Database } from "@/types/database";

const storeAssetsBucket = "store-assets";
const allowedAssetTypes = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"] as const;
const logoMaxSize = 2 * 1024 * 1024;
const faviconMaxSize = 512 * 1024;

type ExistingSettingsAssetRow = {
  id: string;
  logo_url: string | null;
  favicon_url: string | null;
};

export async function updateStoreSettingsAction(formData: FormData) {
  const admin = await requireAdmin();

  if (!admin) {
    redirect("/login");
  }

  const parsed = storeSettingsSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    redirectWithMessage(
      "error",
      parsed.error.issues[0]?.message ?? "تعذر تحديث إعدادات المتجر."
    );
  }

  const supabase = createAdminClient();
  const { data: existing, error: readError } = await supabase
    .from("store_settings")
    .select("id,logo_url,favicon_url")
    .limit(1)
    .maybeSingle()
    .returns<ExistingSettingsAssetRow | null>();

  if (readError) {
    redirectWithMessage("error", "تعذر قراءة إعدادات المتجر الحالية.");
  }

  let logoUrl = parsed.data.logo_url;
  let faviconUrl = parsed.data.favicon_url;

  if (formData.get("remove_logo") === "on") {
    await deleteStoreAssetByUrl(existing?.logo_url);
    logoUrl = null;
  }

  if (formData.get("remove_favicon") === "on") {
    await deleteStoreAssetByUrl(existing?.favicon_url);
    faviconUrl = null;
  }

  const logoFile = getUploadedFile(formData.get("logo_file"));
  const faviconFile = getUploadedFile(formData.get("favicon_file"));

  if (logoFile) {
    const uploadedLogoUrl = await uploadStoreAsset({
      file: logoFile,
      folder: "logo",
      maxSize: logoMaxSize,
      label: "الشعار"
    });
    await deleteStoreAssetByUrl(existing?.logo_url);
    logoUrl = uploadedLogoUrl;
  }

  if (faviconFile) {
    const uploadedFaviconUrl = await uploadStoreAsset({
      file: faviconFile,
      folder: "favicon",
      maxSize: faviconMaxSize,
      label: "الأيقونة"
    });
    await deleteStoreAssetByUrl(existing?.favicon_url);
    faviconUrl = uploadedFaviconUrl;
  }

  if (existing?.logo_url && existing.logo_url !== logoUrl) {
    await deleteStoreAssetByUrl(existing.logo_url);
  }

  if (existing?.favicon_url && existing.favicon_url !== faviconUrl) {
    await deleteStoreAssetByUrl(existing.favicon_url);
  }

  const payload: Database["public"]["Tables"]["store_settings"]["Update"] = {
    ...parsed.data,
    logo_url: logoUrl,
    favicon_url: faviconUrl,
    store_name_ar: parsed.data.store_name,
    store_name_en: parsed.data.store_name,
    store_description: parsed.data.store_description,
    support_email: parsed.data.store_email,
    contact_phone: parsed.data.store_phone,
    default_currency: parsed.data.currency_code,
    maintenance_message_ar: parsed.data.maintenance_message,
    maintenance_message_en: parsed.data.maintenance_message,
    brand_story_ar: parsed.data.store_description
  };

  const query = existing
    ? supabase.from("store_settings").update(payload as never).eq("id", existing.id)
    : supabase.from("store_settings").insert({
        ...payload,
        singleton_key: true
      } as Database["public"]["Tables"]["store_settings"]["Insert"] as never);

  const { error } = await query;

  if (error) {
    redirectWithMessage("error", "تعذر حفظ إعدادات المتجر. حاول مرة أخرى.");
  }

  revalidatePath("/", "layout");
  revalidatePath("/admin", "layout");
  revalidatePath("/");
  revalidatePath("/checkout");
  revalidatePath("/admin/settings");
  redirectWithMessage("success", "تم تحديث إعدادات المتجر بنجاح.");
}

function getUploadedFile(value: FormDataEntryValue | null) {
  if (!(value instanceof File) || value.size === 0) {
    return null;
  }

  return value;
}

async function uploadStoreAsset({
  file,
  folder,
  maxSize,
  label
}: {
  file: File;
  folder: "logo" | "favicon";
  maxSize: number;
  label: string;
}) {
  if (!allowedAssetTypes.includes(file.type as (typeof allowedAssetTypes)[number])) {
    redirectWithMessage("error", `${label} يجب أن يكون PNG أو JPG أو WEBP أو SVG.`);
  }

  if (file.size > maxSize) {
    redirectWithMessage("error", `${label} أكبر من الحجم المسموح.`);
  }

  const supabase = createAdminClient();
  const path = `${folder}/${randomUUID()}${getFileExtension(file.type)}`;
  const { error } = await supabase.storage.from(storeAssetsBucket).upload(path, file, {
    contentType: file.type,
    upsert: false
  });

  if (error) {
    redirectWithMessage("error", `تعذر رفع ${label}. تأكد من إنشاء bucket store-assets.`);
  }

  const {
    data: { publicUrl }
  } = supabase.storage.from(storeAssetsBucket).getPublicUrl(path);

  return publicUrl;
}

async function deleteStoreAssetByUrl(url?: string | null) {
  const path = getStoreAssetPathFromUrl(url);

  if (!path) {
    return;
  }

  const supabase = createAdminClient();
  await supabase.storage.from(storeAssetsBucket).remove([path]);
}

function getStoreAssetPathFromUrl(url?: string | null) {
  if (!url) {
    return null;
  }

  const marker = `/storage/v1/object/public/${storeAssetsBucket}/`;
  const markerIndex = url.indexOf(marker);

  if (markerIndex === -1) {
    return null;
  }

  const pathWithQuery = url.slice(markerIndex + marker.length);
  return decodeURIComponent(pathWithQuery.split("?")[0] ?? "");
}

function getFileExtension(type: string) {
  if (type === "image/jpeg") {
    return ".jpg";
  }

  if (type === "image/png") {
    return ".png";
  }

  if (type === "image/webp") {
    return ".webp";
  }

  return ".svg";
}

function redirectWithMessage(status: "success" | "error", message: string): never {
  const params = new URLSearchParams({ status, message });
  redirect(`/admin/settings?${params.toString()}`);
}

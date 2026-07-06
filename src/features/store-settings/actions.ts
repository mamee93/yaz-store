"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/features/auth/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import { storeSettingsSchema } from "@/validations/store-settings-schema";
import type { Database } from "@/types/database";

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
  const payload: Database["public"]["Tables"]["store_settings"]["Update"] = {
    ...parsed.data,
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

  const { data: existing, error: readError } = await supabase
    .from("store_settings")
    .select("id")
    .limit(1)
    .maybeSingle()
    .returns<{ id: string } | null>();

  if (readError) {
    redirectWithMessage("error", "تعذر قراءة إعدادات المتجر الحالية.");
  }

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

  revalidatePath("/");
  revalidatePath("/checkout");
  revalidatePath("/admin/settings");
  redirectWithMessage("success", "تم تحديث إعدادات المتجر بنجاح.");
}

function redirectWithMessage(status: "success" | "error", message: string): never {
  const params = new URLSearchParams({ status, message });
  redirect(`/admin/settings?${params.toString()}`);
}

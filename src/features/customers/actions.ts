"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentCustomer, requireAdmin } from "@/features/auth/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { customerDeliveryProfileSchema } from "@/validations/customer-profile-schema";
import type { Database } from "@/types/database";

const customerNotesSchema = z.object({
  notes: z.string().trim().max(1000, "ملاحظات العميل يجب ألا تتجاوز 1000 حرف.").nullable()
});

export async function updateCustomerNotesAction(customerId: string, formData: FormData) {
  const admin = await requireAdmin();

  if (!admin) {
    redirect("/login");
  }

  const parsed = customerNotesSchema.safeParse({
    notes: normalizeNullableText(formData.get("notes"))
  });

  if (!parsed.success) {
    redirectWithMessage(
      customerId,
      "error",
      parsed.error.issues[0]?.message ?? "تعذر تحديث ملاحظات العميل."
    );
  }

  const supabase = createAdminClient();
  const updatePayload: Database["public"]["Tables"]["customers"]["Update"] = {
    notes: parsed.data.notes
  };

  const { error } = await supabase
    .from("customers")
    .update(updatePayload as never)
    .eq("id", customerId);

  if (error) {
    redirectWithMessage(customerId, "error", "تعذر تحديث ملاحظات العميل. حاول مرة أخرى.");
  }

  revalidatePath("/admin/customers");
  revalidatePath(`/admin/customers/${customerId}`);
  redirectWithMessage(customerId, "success", "تم تحديث ملاحظات العميل بنجاح.");
}

export async function updateCustomerDeliveryProfileAction(formData: FormData) {
  const profile = await getCurrentCustomer();

  if (!profile?.id) {
    redirect("/login?message=يرجى تسجيل الدخول لتحديث بيانات التوصيل.");
  }

  const authClient = await createClient();
  const {
    data: { user }
  } = await authClient.auth.getUser();

  if (!user || (profile.auth_user_id && profile.auth_user_id !== user.id)) {
    redirect("/login?message=يرجى تسجيل الدخول لتحديث بيانات التوصيل.");
  }

  const parsed = customerDeliveryProfileSchema.safeParse({
    phone: formData.get("phone"),
    governorate: formData.get("governorate"),
    wilayat: formData.get("wilayat"),
    area: formData.get("area"),
    detailed_address: formData.get("detailed_address")
  });

  if (!parsed.success) {
    redirect(
      `/account?status=error&message=${encodeURIComponent(
        parsed.error.issues[0]?.message ?? "تعذر تحديث بيانات التوصيل."
      )}`
    );
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("customers")
    .update({
      ...parsed.data,
      auth_user_id: user.id
    } as Database["public"]["Tables"]["customers"]["Update"] as never)
    .eq("id", profile.id);

  if (error) {
    redirect("/account?status=error&message=تعذر تحديث بيانات التوصيل. حاول مرة أخرى.");
  }

  revalidatePath("/account");
  redirect("/account?status=success&message=تم تحديث بيانات التوصيل بنجاح.");
}

function normalizeNullableText(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function redirectWithMessage(customerId: string, status: "success" | "error", message: string): never {
  const params = new URLSearchParams({ status, message });
  redirect(`/admin/customers/${customerId}?${params.toString()}`);
}

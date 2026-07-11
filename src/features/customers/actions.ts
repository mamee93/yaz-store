"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/features/auth/queries";
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
  const authClient = await createClient();

  const {
    data: { user },
    error: userError
  } = await authClient.auth.getUser();

  if (userError || !user) {
    redirect(
      `/login?message=${encodeURIComponent(
        "يرجى تسجيل الدخول لتحديث بيانات التوصيل."
      )}`
    );
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
        parsed.error.issues[0]?.message ??
          "تحقق من بيانات التوصيل وحاول مرة أخرى."
      )}`
    );
  }

  const fullName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name.trim()
      : "";

  const email = user.email?.trim().toLowerCase() ?? null;
  const supabase = createAdminClient();

  let existingCustomer: { id: string } | null = null;

  if (email) {
    const { data, error: lookupError } = await supabase
      .from("customers")
      .select("id")
      .or(`auth_user_id.eq.${user.id},and(email.eq.${email},auth_user_id.is.null)`)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .returns<{ id: string } | null>();

    if (lookupError) {
      console.error("Customer lookup failed:", {
        message: lookupError.message,
        code: lookupError.code,
        details: lookupError.details,
        hint: lookupError.hint
      });

      redirect(
        `/account?status=error&message=${encodeURIComponent(
          "تعذر التحقق من ملف العميل."
        )}`
      );
    }

    existingCustomer = data;
  } else {
    const { data, error: lookupError } = await supabase
      .from("customers")
      .select("id")
      .eq("auth_user_id", user.id)
      .limit(1)
      .maybeSingle()
      .returns<{ id: string } | null>();

    if (lookupError) {
      console.error("Customer lookup failed:", {
        message: lookupError.message,
        code: lookupError.code,
        details: lookupError.details,
        hint: lookupError.hint
      });

      redirect(
        `/account?status=error&message=${encodeURIComponent(
          "تعذر التحقق من ملف العميل."
        )}`
      );
    }

    existingCustomer = data;
  }

  const customerPayload = {
    auth_user_id: user.id,
    full_name: fullName || email || "عميل عود ياز",
    email,
    phone: parsed.data.phone,
    governorate: parsed.data.governorate,
    wilayat: parsed.data.wilayat,
    area: parsed.data.area,
    detailed_address: parsed.data.detailed_address
  };

  let saveError = null;

  if (existingCustomer) {
    const { error } = await supabase
      .from("customers")
      .update(customerPayload as never)
      .eq("id", existingCustomer.id);

    saveError = error;
  } else {
    const { error } = await supabase
      .from("customers")
      .insert(customerPayload as never);

    saveError = error;
  }

  if (saveError) {
    console.error("Customer delivery profile save failed:", {
      message: saveError.message,
      code: saveError.code,
      details: saveError.details,
      hint: saveError.hint
    });

    redirect(
      `/account?status=error&message=${encodeURIComponent(
        "تعذر حفظ بيانات التوصيل. حاول مرة أخرى."
      )}`
    );
  }

  revalidatePath("/account");

  redirect(
    `/account?status=success&message=${encodeURIComponent(
      "تم حفظ بيانات التوصيل بنجاح."
    )}`
  );
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

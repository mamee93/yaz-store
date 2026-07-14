"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/features/auth/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { customerDeliveryProfileSchema } from "@/validations/customer-profile-schema";
import type { Database } from "@/types/database";

const customerFullNameSchema = z.string().trim().min(2, "الاسم الكامل مطلوب.").max(120, "الاسم طويل جدًا.");

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

  let customerId = existingCustomer?.id ?? null;

  if (existingCustomer) {
    const { error } = await supabase
      .from("customers")
      .update(customerPayload as never)
      .eq("id", existingCustomer.id);

    if (error) {
      console.error("Customer delivery profile save failed:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });

      redirect(
        `/account?status=error&message=${encodeURIComponent(
          "ØªØ¹Ø°Ø± Ø­ÙØ¸ Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„ØªÙˆØµÙŠÙ„. Ø­Ø§ÙˆÙ„ Ù…Ø±Ø© Ø£Ø®Ø±Ù‰."
        )}`
      );
    }
  } else {
    const { data, error } = await supabase
      .from("customers")
      .insert(customerPayload as never)
      .select("id")
      .single()
      .returns<{ id: string }>();

    if (error || !data) {
      console.error("Customer delivery profile save failed:", error);

      redirect(
        `/account?status=error&message=${encodeURIComponent(
          "ØªØ¹Ø°Ø± Ø­ÙØ¸ Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„ØªÙˆØµÙŠÙ„. Ø­Ø§ÙˆÙ„ Ù…Ø±Ø© Ø£Ø®Ø±Ù‰."
        )}`
      );
    }

    customerId = data.id;
  }

  if (customerId) {
    await upsertPrimaryCheckoutAddress({
      customerId,
      fullName: customerPayload.full_name,
      phone: parsed.data.phone,
      governorate: parsed.data.governorate,
      wilayat: parsed.data.wilayat,
      area: parsed.data.area,
      detailedAddress: parsed.data.detailed_address
    });
  } else {
    console.error("Customer delivery profile save failed:", {
      message: "Missing customer id after save",
      code: null,
      details: null,
      hint: null
    });

    redirect(
      `/account?status=error&message=${encodeURIComponent(
        "تعذر حفظ بيانات التوصيل. حاول مرة أخرى."
      )}`
    );
  }

  revalidatePath("/account");
  revalidatePath("/checkout");

  redirect(
    `/account?status=success&message=${encodeURIComponent(
      "تم حفظ بيانات التوصيل بنجاح."
    )}`
  );
}

export async function updateCustomerProfileAction(formData: FormData) {
  const authClient = await createClient();
  const {
    data: { user },
    error: userError
  } = await authClient.auth.getUser();

  if (userError || !user) {
    redirect(`/login?message=${encodeURIComponent("يرجى تسجيل الدخول لتحديث بياناتك.")}`);
  }

  const parsedName = customerFullNameSchema.safeParse(formData.get("full_name"));
  const parsedDelivery = customerDeliveryProfileSchema.safeParse({
    phone: normalizeOmanPhone(formData.get("phone")),
    governorate: formData.get("governorate"),
    wilayat: formData.get("wilayat"),
    area: formData.get("area"),
    detailed_address: formData.get("detailed_address")
  });

  if (!parsedName.success || !parsedDelivery.success) {
    redirect(
      `/account/profile?status=error&message=${encodeURIComponent(
        parsedName.error?.issues[0]?.message ??
          parsedDelivery.error?.issues[0]?.message ??
          "تعذر حفظ البيانات. تحقق من الحقول وحاول مرة أخرى."
      )}`
    );
  }

  const email = user.email?.trim().toLowerCase() ?? null;
  const supabase = createAdminClient();
  const lookupQuery = email
    ? `auth_user_id.eq.${user.id},and(email.eq.${email},auth_user_id.is.null)`
    : `auth_user_id.eq.${user.id}`;
  const { data: existingCustomer, error: lookupError } = await supabase
    .from("customers")
    .select("id")
    .or(lookupQuery)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()
    .returns<{ id: string } | null>();

  if (lookupError) {
    console.error("Customer profile lookup failed", lookupError);
    redirect(`/account/profile?status=error&message=${encodeURIComponent("تعذر التحقق من ملف العميل.")}`);
  }

  const payload = {
    auth_user_id: user.id,
    full_name: parsedName.data,
    email,
    phone: parsedDelivery.data.phone,
    governorate: parsedDelivery.data.governorate,
    wilayat: parsedDelivery.data.wilayat,
    area: parsedDelivery.data.area,
    detailed_address: parsedDelivery.data.detailed_address
  };

  const { error } = existingCustomer
    ? await supabase.from("customers").update(payload as never).eq("id", existingCustomer.id)
    : await supabase.from("customers").insert(payload as never);

  if (error) {
    console.error("Customer profile save failed", error);
    redirect(`/account/profile?status=error&message=${encodeURIComponent("تعذر حفظ بياناتك. حاول مرة أخرى.")}`);
  }

  const savedCustomerId =
    existingCustomer?.id ?? (await findCustomerIdForAuthUser(user.id, email));

  if (savedCustomerId) {
    await upsertPrimaryCheckoutAddress({
      customerId: savedCustomerId,
      fullName: parsedName.data,
      phone: parsedDelivery.data.phone,
      governorate: parsedDelivery.data.governorate,
      wilayat: parsedDelivery.data.wilayat,
      area: parsedDelivery.data.area,
      detailedAddress: parsedDelivery.data.detailed_address
    });
  }

  revalidatePath("/account");
  revalidatePath("/account/profile");
  revalidatePath("/checkout");
  redirect(`/account/profile?status=success&message=${encodeURIComponent("تم حفظ بياناتك بنجاح.")}`);
}

function normalizeNullableText(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

async function findCustomerIdForAuthUser(authUserId: string, email: string | null) {
  const supabase = createAdminClient();
  const query = email
    ? `auth_user_id.eq.${authUserId},and(email.eq.${email},auth_user_id.is.null)`
    : `auth_user_id.eq.${authUserId}`;
  const { data, error } = await supabase
    .from("customers")
    .select("id")
    .or(query)
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()
    .returns<{ id: string } | null>();

  if (error) {
    console.error("Customer id lookup after profile save failed", error);
    return null;
  }

  return data?.id ?? null;
}

async function upsertPrimaryCheckoutAddress({
  customerId,
  fullName,
  phone,
  governorate,
  wilayat,
  area,
  detailedAddress
}: {
  customerId: string;
  fullName: string;
  phone: string;
  governorate: string | null;
  wilayat: string | null;
  area: string | null;
  detailedAddress: string | null;
}) {
  if (!governorate || !wilayat || !detailedAddress) {
    return;
  }

  const supabase = createAdminClient();
  const { data: addresses, error: lookupError } = await supabase
    .from("addresses")
    .select("id,is_default")
    .eq("customer_id", customerId)
    .order("is_default", { ascending: false })
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .returns<Array<Pick<Database["public"]["Tables"]["addresses"]["Row"], "id" | "is_default">>>();

  if (lookupError) {
    console.error("Checkout address lookup after customer save failed", lookupError);
    return;
  }

  const address = addresses?.[0] ?? null;
  const payload = {
    full_name: fullName,
    phone,
    country: "Oman",
    governorate,
    wilayat,
    city: wilayat,
    area,
    address_line_1: detailedAddress,
    is_default: true
  } satisfies Database["public"]["Tables"]["addresses"]["Update"];

  if (address) {
    const { error } = await supabase
      .from("addresses")
      .update(payload as never)
      .eq("id", address.id);

    if (error) {
      console.error("Checkout address update after customer save failed", error);
    }

    return;
  }

  const { error } = await supabase.from("addresses").insert({
    customer_id: customerId,
    ...payload
  } as Database["public"]["Tables"]["addresses"]["Insert"] as never);

  if (error) {
    console.error("Checkout address insert after customer save failed", error);
  }
}

function normalizeOmanPhone(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return "";
  }

  const digits = value.replace(/[^\d]/g, "");
  return digits.startsWith("968") && digits.length > 8 ? digits.slice(3) : digits;
}

function redirectWithMessage(customerId: string, status: "success" | "error", message: string): never {
  const params = new URLSearchParams({ status, message });
  redirect(`/admin/customers/${customerId}?${params.toString()}`);
}

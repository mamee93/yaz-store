"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/features/auth/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { customerDeliveryProfileSchema } from "@/validations/customer-profile-schema";
import type { Database } from "@/types/database";

type CustomerIdentity = Pick<
  Database["public"]["Tables"]["customers"]["Row"],
  "id" | "auth_user_id" | "email" | "whatsapp_number" | "updated_at" | "created_at"
>;

type SavedCustomerProfile = Pick<
  Database["public"]["Tables"]["customers"]["Row"],
  | "id"
  | "auth_user_id"
  | "full_name"
  | "phone"
  | "email"
  | "whatsapp_number"
  | "governorate"
  | "wilayat"
  | "area"
  | "detailed_address"
  | "updated_at"
>;

type SyncedAddress = Pick<
  Database["public"]["Tables"]["addresses"]["Row"],
  | "id"
  | "customer_id"
  | "full_name"
  | "phone"
  | "governorate"
  | "wilayat"
  | "city"
  | "area"
  | "address_line_1"
  | "delivery_notes"
  | "is_default"
  | "updated_at"
>;

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
      detailedAddress: parsed.data.detailed_address,
      deliveryNotes: null
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
  const { data: authCustomer, error: authLookupError } = await supabase
    .from("customers")
    .select("id,auth_user_id,email,whatsapp_number,updated_at,created_at")
    .eq("auth_user_id", user.id)
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()
    .returns<CustomerIdentity | null>();

  if (authLookupError) {
    console.error("Customer profile lookup failed", authLookupError);
    redirect(`/account/profile?status=error&message=${encodeURIComponent("تعذر التحقق من ملف العميل.")}`);
  }

  const { data: emailCustomer, error: emailLookupError } =
    !authCustomer && email
      ? await supabase
          .from("customers")
          .select("id,auth_user_id,email,whatsapp_number,updated_at,created_at")
          .eq("email", email)
          .is("auth_user_id", null)
          .order("updated_at", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
          .returns<CustomerIdentity | null>()
      : { data: null, error: null };

  if (emailLookupError) {
    console.error("Customer profile email fallback lookup failed", emailLookupError);
    redirect(`/account/profile?status=error&message=${encodeURIComponent("تعذر التحقق من ملف العميل.")}`);
  }

  const existingCustomer = authCustomer ?? emailCustomer;

  const payload = {
    auth_user_id: user.id,
    full_name: parsedName.data,
    email,
    phone: parsedDelivery.data.phone,
    whatsapp_number: getOptionalFormText(formData.get("whatsapp_number")) ?? existingCustomer?.whatsapp_number ?? null,
    governorate: parsedDelivery.data.governorate,
    wilayat: parsedDelivery.data.wilayat,
    area: parsedDelivery.data.area,
    detailed_address: parsedDelivery.data.detailed_address,
    updated_at: new Date().toISOString()
  } satisfies Database["public"]["Tables"]["customers"]["Update"];

  const savedCustomer = existingCustomer
    ? await updateCustomerProfileRow(existingCustomer.id, payload)
    : await insertCustomerProfileRow(payload);

  const savedAddress = await upsertPrimaryCheckoutAddress({
    customerId: savedCustomer.id,
    fullName: savedCustomer.full_name,
    phone: savedCustomer.phone,
    governorate: savedCustomer.governorate,
    wilayat: savedCustomer.wilayat,
    area: savedCustomer.area,
    detailedAddress: savedCustomer.detailed_address,
    deliveryNotes: getOptionalFormText(formData.get("delivery_notes"))
  });

  assertProfileSaveMatchesInput(savedCustomer, savedAddress, parsedDelivery.data);

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

async function updateCustomerProfileRow(
  customerId: string,
  payload: Database["public"]["Tables"]["customers"]["Update"]
) {
  const supabase = createAdminClient();
  const { data, error, count } = await supabase
    .from("customers")
    .update(payload as never, { count: "exact" })
    .eq("id", customerId)
    .select(
      "id,auth_user_id,full_name,phone,email,whatsapp_number,governorate,wilayat,area,detailed_address,updated_at"
    )
    .maybeSingle()
    .returns<SavedCustomerProfile | null>();

  if (error || !data || count === 0) {
    console.error("Customer profile update failed", { error, count, customerId });
    redirect(`/account/profile?status=error&message=${encodeURIComponent("تعذر حفظ بياناتك. لم يتم تحديث سجل العميل.")}`);
  }

  return data;
}

async function insertCustomerProfileRow(payload: Database["public"]["Tables"]["customers"]["Update"]) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("customers")
    .insert(payload as Database["public"]["Tables"]["customers"]["Insert"] as never)
    .select(
      "id,auth_user_id,full_name,phone,email,whatsapp_number,governorate,wilayat,area,detailed_address,updated_at"
    )
    .single()
    .returns<SavedCustomerProfile>();

  if (error || !data) {
    console.error("Customer profile insert failed", error);
    redirect(`/account/profile?status=error&message=${encodeURIComponent("تعذر حفظ بياناتك. لم يتم إنشاء سجل العميل.")}`);
  }

  return data;
}

async function upsertPrimaryCheckoutAddress({
  customerId,
  fullName,
  phone,
  governorate,
  wilayat,
  area,
  detailedAddress,
  deliveryNotes
}: {
  customerId: string;
  fullName: string;
  phone: string;
  governorate: string | null;
  wilayat: string | null;
  area: string | null;
  detailedAddress: string | null;
  deliveryNotes: string | null;
}) {
  if (!governorate || !wilayat || !detailedAddress) {
    console.error("Checkout address save skipped because required address fields are missing", {
      customerId,
      hasGovernorate: Boolean(governorate),
      hasWilayat: Boolean(wilayat),
      hasDetailedAddress: Boolean(detailedAddress)
    });
    redirect(`/account/profile?status=error&message=${encodeURIComponent("تعذر حفظ العنوان. أكمل المحافظة والولاية والعنوان التفصيلي.")}`);
  }

  const supabase = createAdminClient();
  const { data: addresses, error: lookupError } = await supabase
    .from("addresses")
    .select("id,customer_id,full_name,phone,governorate,wilayat,city,area,address_line_1,delivery_notes,is_default,updated_at")
    .eq("customer_id", customerId)
    .order("is_default", { ascending: false })
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .returns<SyncedAddress[]>();

  if (lookupError) {
    console.error("Checkout address lookup after customer save failed", lookupError);
    redirect(`/account/profile?status=error&message=${encodeURIComponent("تم حفظ العميل، لكن تعذر قراءة عنوان التوصيل.")}`);
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
    delivery_notes: deliveryNotes ?? address?.delivery_notes ?? null,
    is_default: true,
    updated_at: new Date().toISOString()
  } satisfies Database["public"]["Tables"]["addresses"]["Update"];

  if (address) {
    const { data, error, count } = await supabase
      .from("addresses")
      .update(payload as never, { count: "exact" })
      .eq("id", address.id)
      .select("id,customer_id,full_name,phone,governorate,wilayat,city,area,address_line_1,delivery_notes,is_default,updated_at")
      .maybeSingle()
      .returns<SyncedAddress | null>();

    if (error || !data || count === 0) {
      console.error("Checkout address update after customer save failed", { error, count, addressId: address.id });
      redirect(`/account/profile?status=error&message=${encodeURIComponent("تم حفظ العميل، لكن تعذر تحديث عنوان التوصيل.")}`);
    }

    return data;
  }

  const { data, error } = await supabase
    .from("addresses")
    .insert({
      customer_id: customerId,
      ...payload
    } as Database["public"]["Tables"]["addresses"]["Insert"] as never)
    .select("id,customer_id,full_name,phone,governorate,wilayat,city,area,address_line_1,delivery_notes,is_default,updated_at")
    .single()
    .returns<SyncedAddress>();

  if (error || !data) {
    console.error("Checkout address insert after customer save failed", error);
    redirect(`/account/profile?status=error&message=${encodeURIComponent("تم حفظ العميل، لكن تعذر إنشاء عنوان التوصيل.")}`);
  }

  return data;
}

function assertProfileSaveMatchesInput(
  customer: SavedCustomerProfile,
  address: SyncedAddress,
  input: {
    phone: string;
    governorate: string | null;
    wilayat: string | null;
    area: string | null;
    detailed_address: string | null;
  }
) {
  const customerMatches =
    normalizeCompare(customer.phone) === normalizeCompare(input.phone) &&
    normalizeCompare(customer.governorate) === normalizeCompare(input.governorate) &&
    normalizeCompare(customer.wilayat) === normalizeCompare(input.wilayat) &&
    normalizeCompare(customer.area) === normalizeCompare(input.area) &&
    normalizeCompare(customer.detailed_address) === normalizeCompare(input.detailed_address);

  const addressMatches =
    address.customer_id === customer.id &&
    normalizeCompare(address.phone) === normalizeCompare(input.phone) &&
    normalizeCompare(address.governorate) === normalizeCompare(input.governorate) &&
    normalizeCompare(address.wilayat) === normalizeCompare(input.wilayat) &&
    normalizeCompare(address.city) === normalizeCompare(input.wilayat) &&
    normalizeCompare(address.area) === normalizeCompare(input.area) &&
    normalizeCompare(address.address_line_1) === normalizeCompare(input.detailed_address);

  if (!customerMatches || !addressMatches) {
    console.error("Customer profile save verification failed", {
      customerId: customer.id,
      addressId: address.id,
      customerMatches,
      addressMatches
    });
    redirect(`/account/profile?status=error&message=${encodeURIComponent("تعذر تأكيد حفظ بيانات التوصيل. حاول مرة أخرى.")}`);
  }
}

function getOptionalFormText(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeCompare(value: string | null | undefined) {
  return (value ?? "").trim().replace(/\s+/g, " ");
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

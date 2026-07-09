"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminRole } from "@/features/auth/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import { shippingZoneSchema } from "@/validations/shipping-schema";
import type { Database } from "@/types/database";

export type ShippingCalculation = {
  isValid: boolean;
  message: string | null;
  zone: Database["public"]["Tables"]["shipping_zones"]["Row"] | null;
  shippingFee: number;
  shippingArea: string | null;
};

const adminShippingPath = "/admin/shipping";

export async function createShippingZoneAction(formData: FormData) {
  await assertAdmin();

  const parsed = shippingZoneSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    redirectWithMessage(
      "/admin/shipping/new",
      "error",
      parsed.error.issues[0]?.message ?? "تعذر إنشاء منطقة التوصيل."
    );
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("shipping_zones")
    .insert(parsed.data as Database["public"]["Tables"]["shipping_zones"]["Insert"] as never)
    .select("id")
    .single()
    .returns<{ id: string }>();

  if (error || !data) {
    redirectWithMessage("/admin/shipping/new", "error", getShippingErrorMessage(error?.code));
  }

  revalidateShippingPaths();
  redirectWithMessage(`/admin/shipping/${data.id}/edit`, "success", "تم إنشاء منطقة التوصيل بنجاح.");
}

export async function updateShippingZoneAction(zoneId: string, formData: FormData) {
  await assertAdmin();

  const parsed = shippingZoneSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    redirectWithMessage(
      `/admin/shipping/${zoneId}/edit`,
      "error",
      parsed.error.issues[0]?.message ?? "تعذر تحديث منطقة التوصيل."
    );
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("shipping_zones")
    .update(parsed.data as Database["public"]["Tables"]["shipping_zones"]["Update"] as never)
    .eq("id", zoneId);

  if (error) {
    redirectWithMessage(`/admin/shipping/${zoneId}/edit`, "error", getShippingErrorMessage(error.code));
  }

  revalidateShippingPaths(zoneId);
  redirectWithMessage(`/admin/shipping/${zoneId}/edit`, "success", "تم تحديث منطقة التوصيل بنجاح.");
}

export async function toggleShippingZoneStatusAction(zoneId: string, isActive: boolean) {
  await assertAdmin();

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("shipping_zones")
    .update({ is_active: isActive } as never)
    .eq("id", zoneId);

  if (error) {
    redirectWithMessage(adminShippingPath, "error", "تعذر تحديث حالة منطقة التوصيل.");
  }

  revalidateShippingPaths(zoneId);
  redirectWithMessage(
    adminShippingPath,
    "success",
    isActive ? "تم تفعيل منطقة التوصيل." : "تم إيقاف منطقة التوصيل."
  );
}

export async function deactivateShippingZoneAction(zoneId: string) {
  await toggleShippingZoneStatusAction(zoneId, false);
}

export async function calculateShippingForCheckout({
  shippingZoneId,
  subtotalAfterDiscount
}: {
  shippingZoneId: string | null;
  subtotalAfterDiscount: number;
}): Promise<ShippingCalculation> {
  if (!shippingZoneId) {
    return {
      isValid: false,
      message: "اختر منطقة التوصيل قبل تأكيد الطلب.",
      zone: null,
      shippingFee: 0,
      shippingArea: null
    };
  }

  const supabase = createAdminClient();
  const { data: zone, error } = await supabase
    .from("shipping_zones")
    .select(
      "id,name,city,area,delivery_fee_omr,free_shipping_minimum_omr,estimated_delivery_time,is_active,sort_order,created_at,updated_at"
    )
    .eq("id", shippingZoneId)
    .eq("is_active", true)
    .maybeSingle()
    .returns<Database["public"]["Tables"]["shipping_zones"]["Row"] | null>();

  if (error || !zone) {
    return {
      isValid: false,
      message: "منطقة التوصيل غير متاحة حاليا.",
      zone: null,
      shippingFee: 0,
      shippingArea: null
    };
  }

  const freeShippingApplies =
    zone.free_shipping_minimum_omr !== null &&
    subtotalAfterDiscount >= zone.free_shipping_minimum_omr;

  return {
    isValid: true,
    message: null,
    zone,
    shippingFee: freeShippingApplies ? 0 : Number(zone.delivery_fee_omr),
    shippingArea: `${zone.city} - ${zone.area}`
  };
}

async function assertAdmin() {
  const admin = await requireAdminRole(["owner", "manager"]);

  if (!admin) {
    redirect("/admin?status=error&message=ليست لديك صلاحية لإدارة التوصيل.");
  }
}

function revalidateShippingPaths(zoneId?: string) {
  revalidatePath(adminShippingPath);
  revalidatePath("/checkout");

  if (zoneId) {
    revalidatePath(`/admin/shipping/${zoneId}/edit`);
  }
}

function redirectWithMessage(path: string, status: "success" | "error", message: string): never {
  const params = new URLSearchParams({ status, message });
  redirect(`${path}?${params.toString()}`);
}

function getShippingErrorMessage(code?: string) {
  if (code === "23505") {
    return "هذه المدينة والمنطقة مضافة مسبقا.";
  }

  if (code === "23514") {
    return "بيانات التوصيل لا تطابق شروط الرسوم.";
  }

  return "تعذر حفظ منطقة التوصيل. حاول مرة أخرى.";
}

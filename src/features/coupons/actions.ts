"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminRole } from "@/features/auth/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import { couponSchema, checkoutCouponSchema } from "@/validations/coupon-schema";
import type { Database } from "@/types/database";

type CouponRow = Database["public"]["Tables"]["coupons"]["Row"];
type ProductCouponRow = {
  id: string;
  price_omr: number;
  is_active: boolean;
  deleted_at: string | null;
};

export type CouponValidationState = {
  status: "idle" | "success" | "error";
  code: string | null;
  message: string | null;
  discountAmount: number;
  subtotal: number;
  total: number;
  cartSignature: string;
};

const adminCouponsPath = "/admin/coupons";
const deliveryFee = 2;

export async function createCouponAction(formData: FormData) {
  await assertAdmin();

  const parsed = couponSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    redirectWithMessage(
      "/admin/coupons/new",
      "error",
      parsed.error.issues[0]?.message ?? "تعذر إنشاء الكوبون. تحقق من البيانات."
    );
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("coupons")
    .insert(parsed.data as Database["public"]["Tables"]["coupons"]["Insert"] as never)
    .select("id")
    .single()
    .returns<{ id: string }>();

  if (error || !data) {
    redirectWithMessage("/admin/coupons/new", "error", getCouponErrorMessage(error?.code));
  }

  revalidateCouponPaths();
  redirectWithMessage(`/admin/coupons/${data.id}/edit`, "success", "تم إنشاء الكوبون بنجاح.");
}

export async function updateCouponAction(couponId: string, formData: FormData) {
  await assertAdmin();

  const parsed = couponSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    redirectWithMessage(
      `/admin/coupons/${couponId}/edit`,
      "error",
      parsed.error.issues[0]?.message ?? "تعذر تحديث الكوبون. تحقق من البيانات."
    );
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("coupons")
    .update(parsed.data as Database["public"]["Tables"]["coupons"]["Update"] as never)
    .eq("id", couponId);

  if (error) {
    redirectWithMessage(`/admin/coupons/${couponId}/edit`, "error", getCouponErrorMessage(error.code));
  }

  revalidateCouponPaths(couponId);
  redirectWithMessage(`/admin/coupons/${couponId}/edit`, "success", "تم تحديث الكوبون بنجاح.");
}

export async function toggleCouponStatusAction(couponId: string, isActive: boolean) {
  await assertAdmin();

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("coupons")
    .update({ is_active: isActive } as never)
    .eq("id", couponId);

  if (error) {
    redirectWithMessage(adminCouponsPath, "error", "تعذر تحديث حالة الكوبون.");
  }

  revalidateCouponPaths(couponId);
  redirectWithMessage(
    adminCouponsPath,
    "success",
    isActive ? "تم تفعيل الكوبون بنجاح." : "تم إيقاف الكوبون بنجاح."
  );
}

export async function deactivateCouponAction(couponId: string) {
  await toggleCouponStatusAction(couponId, false);
}

export async function validateCheckoutCouponAction(
  _previousState: CouponValidationState,
  formData: FormData
): Promise<CouponValidationState> {
  const intent = formData.get("intent");
  const requestedItems = getRequestedItems(formData);
  const cartSignature = getCartSignature(requestedItems);
  const totals = await getServerCartTotals(requestedItems);

  if (requestedItems.length === 0 || totals.subtotal <= 0) {
    return {
      status: "error",
      code: null,
      message: "السلة فارغة ولا يمكن تطبيق كوبون الخصم.",
      discountAmount: 0,
      subtotal: totals.subtotal,
      total: totals.subtotal + deliveryFee,
      cartSignature
    };
  }

  if (intent === "remove") {
    return {
      status: "idle",
      code: null,
      message: "تمت إزالة كوبون الخصم.",
      discountAmount: 0,
      subtotal: totals.subtotal,
      total: totals.subtotal + deliveryFee,
      cartSignature
    };
  }

  const parsed = checkoutCouponSchema.safeParse({ code: formData.get("couponCode") });
  const code = parsed.success ? parsed.data.code : null;

  if (!parsed.success || !code) {
    return {
      status: "error",
      code: null,
      message: parsed.success ? "أدخل كود الخصم أولا." : parsed.error.issues[0]?.message,
      discountAmount: 0,
      subtotal: totals.subtotal,
      total: totals.subtotal + deliveryFee,
      cartSignature
    };
  }

  const result = await validateCouponForSubtotal(code, totals.subtotal);

  if (!result.isValid) {
    return {
      status: "error",
      code,
      message: result.message,
      discountAmount: 0,
      subtotal: totals.subtotal,
      total: totals.subtotal + deliveryFee,
      cartSignature
    };
  }

  return {
    status: "success",
    code,
    message: "تم تطبيق كوبون الخصم بنجاح.",
    discountAmount: result.discountAmount,
    subtotal: totals.subtotal,
    total: roundMoney(Math.max(0, totals.subtotal - result.discountAmount) + deliveryFee),
    cartSignature
  };
}

export async function validateCouponForSubtotal(code: string | null, subtotal: number) {
  const normalizedCode = code?.trim().toUpperCase();

  if (!normalizedCode) {
    return {
      isValid: true,
      code: null,
      coupon: null,
      discountAmount: 0,
      message: null
    };
  }

  const supabase = createAdminClient();
  const { data: coupon, error } = await supabase
    .from("coupons")
    .select(
      "id,code,name,description,discount_type,discount_value,minimum_order_amount,maximum_discount_amount,usage_limit,used_count,starts_at,expires_at,is_active,created_at,updated_at"
    )
    .eq("code", normalizedCode)
    .maybeSingle()
    .returns<CouponRow | null>();

  if (error || !coupon) {
    return invalidCoupon(normalizedCode, "كود الخصم غير صحيح.");
  }

  const now = new Date();

  if (!coupon.is_active) {
    return invalidCoupon(normalizedCode, "كود الخصم غير مفعل.");
  }

  if (coupon.starts_at && new Date(coupon.starts_at) > now) {
    return invalidCoupon(normalizedCode, "كود الخصم لم يبدأ بعد.");
  }

  if (coupon.expires_at && new Date(coupon.expires_at) <= now) {
    return invalidCoupon(normalizedCode, "كود الخصم منتهي.");
  }

  if (coupon.usage_limit !== null && coupon.used_count >= coupon.usage_limit) {
    return invalidCoupon(normalizedCode, "تم استخدام كود الخصم بالكامل.");
  }

  if (subtotal < coupon.minimum_order_amount) {
    return invalidCoupon(
      normalizedCode,
      `الحد الأدنى لتطبيق هذا الكوبون هو ${coupon.minimum_order_amount.toFixed(3)} OMR.`
    );
  }

  const discountAmount = calculateCouponDiscount(coupon, subtotal);

  return {
    isValid: true,
    code: normalizedCode,
    coupon,
    discountAmount,
    message: null
  };
}

export async function incrementCouponUsage(couponId: string, usedCount: number) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("coupons")
    .update({ used_count: usedCount + 1 } as never)
    .eq("id", couponId);

  if (error) {
    throw error;
  }
}

function calculateCouponDiscount(coupon: CouponRow, subtotal: number) {
  const rawDiscount =
    coupon.discount_type === "percentage"
      ? subtotal * (coupon.discount_value / 100)
      : coupon.discount_value;
  const cappedByMaximum =
    coupon.maximum_discount_amount !== null
      ? Math.min(rawDiscount, coupon.maximum_discount_amount)
      : rawDiscount;

  return roundMoney(Math.min(subtotal, cappedByMaximum));
}

async function getServerCartTotals(items: Array<{ productId: string; quantity: number }>) {
  if (items.length === 0) {
    return { subtotal: 0 };
  }

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("products")
    .select("id,price_omr,is_active,deleted_at")
    .in(
      "id",
      items.map((item) => item.productId)
    )
    .returns<ProductCouponRow[]>();

  const productsById = new Map((data ?? []).map((product) => [product.id, product]));
  const subtotal = items.reduce((total, item) => {
    const product = productsById.get(item.productId);

    if (!product || !product.is_active || product.deleted_at) {
      return total;
    }

    return total + Number(product.price_omr) * item.quantity;
  }, 0);

  return { subtotal: roundMoney(subtotal) };
}

function getRequestedItems(formData: FormData) {
  const productIds = formData.getAll("productId");
  const quantities = formData.getAll("quantity");

  return productIds
    .map((productId, index) => ({
      productId: typeof productId === "string" ? productId : "",
      quantity: Number(quantities[index] ?? 0)
    }))
    .filter((item) => item.productId && Number.isInteger(item.quantity) && item.quantity > 0);
}

function getCartSignature(items: Array<{ productId: string; quantity: number }>) {
  return [...items]
    .sort((a, b) => a.productId.localeCompare(b.productId))
    .map((item) => `${item.productId}:${item.quantity}`)
    .join("|");
}

async function assertAdmin() {
  const admin = await requireAdminRole(["owner", "manager"]);

  if (!admin) {
    redirect("/admin?status=error&message=ليست لديك صلاحية لإدارة الكوبونات.");
  }
}

function revalidateCouponPaths(couponId?: string) {
  revalidatePath(adminCouponsPath);
  revalidatePath("/checkout");

  if (couponId) {
    revalidatePath(`/admin/coupons/${couponId}/edit`);
  }
}

function redirectWithMessage(path: string, status: "success" | "error", message: string): never {
  const params = new URLSearchParams({ status, message });
  redirect(`${path}?${params.toString()}`);
}

function getCouponErrorMessage(code?: string) {
  if (code === "23505") {
    return "كود الخصم مستخدم مسبقا.";
  }

  if (code === "23514") {
    return "بيانات الكوبون لا تطابق شروط الخصم.";
  }

  return "تعذر حفظ الكوبون. حاول مرة أخرى.";
}

function invalidCoupon(code: string, message: string) {
  return {
    isValid: false,
    code,
    coupon: null,
    discountAmount: 0,
    message
  };
}

function roundMoney(value: number) {
  return Number(value.toFixed(3));
}

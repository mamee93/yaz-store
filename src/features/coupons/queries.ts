import { requireAdmin } from "@/features/auth/queries";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type CouponRow = Database["public"]["Tables"]["coupons"]["Row"];
export type CouponStatus = "active" | "inactive" | "scheduled" | "expired" | "used_up";
export type CouponFilter = "all" | "active" | "inactive" | "expired";

export type AdminCouponStats = {
  total: number;
  active: number;
  inactive: number;
  expired: number;
  totalRedemptions: number;
};

export async function getAdminCoupons({
  search,
  filter = "all"
}: {
  search?: string;
  filter?: CouponFilter;
} = {}) {
  const admin = await requireAdmin();

  if (!admin) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("coupons")
    .select(
      "id,code,name,description,discount_type,discount_value,minimum_order_amount,maximum_discount_amount,usage_limit,used_count,starts_at,expires_at,is_active,created_at,updated_at"
    )
    .order("created_at", { ascending: false })
    .limit(500)
    .returns<CouponRow[]>();

  if (error) {
    console.error("Failed to read admin coupons", error);
    return [];
  }

  const normalizedSearch = normalizeSearch(search);

  return (data ?? [])
    .filter((coupon) => matchesCouponSearch(coupon, normalizedSearch))
    .filter((coupon) => matchesCouponFilter(coupon, filter));
}

export async function getAdminCouponsStats() {
  const coupons = await getAdminCoupons();

  return coupons.reduce<AdminCouponStats>(
    (stats, coupon) => {
      const status = getCouponStatus(coupon);

      stats.total += 1;
      stats.totalRedemptions += coupon.used_count;

      if (status === "active") {
        stats.active += 1;
      }

      if (status === "inactive") {
        stats.inactive += 1;
      }

      if (status === "expired") {
        stats.expired += 1;
      }

      return stats;
    },
    {
      total: 0,
      active: 0,
      inactive: 0,
      expired: 0,
      totalRedemptions: 0
    }
  );
}

export async function getAdminCouponById(couponId: string) {
  const admin = await requireAdmin();

  if (!admin) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("coupons")
    .select(
      "id,code,name,description,discount_type,discount_value,minimum_order_amount,maximum_discount_amount,usage_limit,used_count,starts_at,expires_at,is_active,created_at,updated_at"
    )
    .eq("id", couponId)
    .maybeSingle()
    .returns<CouponRow | null>();

  if (error) {
    console.error("Failed to read admin coupon", error);
    return null;
  }

  return data;
}

export function getCouponStatus(coupon: CouponRow): CouponStatus {
  const now = new Date();
  const startsAt = coupon.starts_at ? new Date(coupon.starts_at) : null;
  const expiresAt = coupon.expires_at ? new Date(coupon.expires_at) : null;

  if (!coupon.is_active) {
    return "inactive";
  }

  if (coupon.usage_limit !== null && coupon.used_count >= coupon.usage_limit) {
    return "used_up";
  }

  if (expiresAt && expiresAt <= now) {
    return "expired";
  }

  if (startsAt && startsAt > now) {
    return "scheduled";
  }

  return "active";
}

function matchesCouponSearch(coupon: CouponRow, search: string) {
  if (!search) {
    return true;
  }

  return [coupon.code, coupon.name]
    .filter(Boolean)
    .some((value) => normalizeSearch(value).includes(search));
}

function matchesCouponFilter(coupon: CouponRow, filter: CouponFilter) {
  if (filter === "all") {
    return true;
  }

  const status = getCouponStatus(coupon);

  if (filter === "active") {
    return status === "active" || status === "scheduled";
  }

  if (filter === "inactive") {
    return status === "inactive" || status === "used_up";
  }

  return status === "expired";
}

function normalizeSearch(value?: string | null) {
  return value?.trim().toLocaleLowerCase("ar-OM") ?? "";
}

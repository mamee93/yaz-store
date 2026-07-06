import { Badge } from "@/components/ui";
import { getCouponStatus, type CouponRow } from "@/features/coupons/queries";

type CouponStatusBadgeProps = {
  coupon: CouponRow;
};

const statusLabels = {
  active: "نشط",
  inactive: "متوقف",
  scheduled: "مجدول",
  expired: "منتهي",
  used_up: "مكتمل الاستخدام"
};

export function CouponStatusBadge({ coupon }: CouponStatusBadgeProps) {
  const status = getCouponStatus(coupon);

  return <Badge variant={getVariant(status)}>{statusLabels[status]}</Badge>;
}

function getVariant(status: ReturnType<typeof getCouponStatus>) {
  if (status === "active") {
    return "success";
  }

  if (status === "expired" || status === "used_up") {
    return "danger";
  }

  if (status === "scheduled") {
    return "gold";
  }

  return "soft";
}

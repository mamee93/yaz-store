import Link from "next/link";
import { Eye, PauseCircle, PlayCircle, Trash2 } from "lucide-react";
import { ConfirmActionButton } from "@/components/admin/confirm-action-button";
import { Button, Card, EmptyState, Price } from "@/components/ui";
import {
  deleteCouponAction,
  toggleCouponStatusAction
} from "@/features/coupons/actions";
import type { CouponRow } from "@/features/coupons/queries";
import { CouponStatusBadge } from "./coupon-status-badge";

type CouponsTableProps = {
  coupons: CouponRow[];
};

const discountTypeLabels = {
  percentage: "نسبة",
  fixed: "مبلغ ثابت"
};

export function CouponsTable({ coupons }: CouponsTableProps) {
  if (coupons.length === 0) {
    return (
      <EmptyState
        title="لا توجد كوبونات"
        description="أضف كوبون خصم جديد أو عدل معايير البحث والتصفية."
      />
    );
  }

  return (
    <Card className="overflow-hidden shadow-none">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[64rem] text-right text-sm">
          <thead className="bg-oud-beige/35 text-xs text-oud-muted">
            <tr>
              <th className="px-5 py-3 font-semibold">الكود</th>
              <th className="px-5 py-3 font-semibold">الاسم</th>
              <th className="px-5 py-3 font-semibold">نوع الخصم</th>
              <th className="px-5 py-3 font-semibold">القيمة</th>
              <th className="px-5 py-3 font-semibold">الاستخدام</th>
              <th className="px-5 py-3 font-semibold">الانتهاء</th>
              <th className="px-5 py-3 font-semibold">الحالة</th>
              <th className="px-5 py-3 font-semibold">إجراء</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-oud-brown/10">
            {coupons.map((coupon) => {
              const toggleAction = toggleCouponStatusAction.bind(null, coupon.id, !coupon.is_active);
              const deleteAction = deleteCouponAction.bind(null, coupon.id);

              return (
                <tr key={coupon.id} className="bg-oud-pearl">
                  <td className="px-5 py-4 font-semibold text-oud-brown" dir="ltr">
                    {coupon.code}
                  </td>
                  <td className="px-5 py-4 text-oud-ink">{coupon.name}</td>
                  <td className="px-5 py-4 text-oud-muted">
                    {discountTypeLabels[coupon.discount_type]}
                  </td>
                  <td className="px-5 py-4">
                    {coupon.discount_type === "percentage" ? (
                      <span className="font-semibold text-oud-brown">
                        {coupon.discount_value}%
                      </span>
                    ) : (
                      <Price value={coupon.discount_value} />
                    )}
                  </td>
                  <td className="px-5 py-4 text-oud-muted">
                    {coupon.used_count} / {coupon.usage_limit ?? "غير محدود"}
                  </td>
                  <td className="px-5 py-4 text-oud-muted">
                    {coupon.expires_at ? formatDate(coupon.expires_at) : "بدون انتهاء"}
                  </td>
                  <td className="px-5 py-4">
                    <CouponStatusBadge coupon={coupon} />
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/admin/coupons/${coupon.id}/edit`}
                        className="inline-flex items-center gap-2 text-xs font-semibold text-oud-brown"
                      >
                        <Eye className="size-4" aria-hidden="true" />
                        تعديل
                      </Link>
                      <form action={toggleAction}>
                        <Button
                          type="submit"
                          size="sm"
                          variant={coupon.is_active ? "secondary" : "gold"}
                          leftIcon={
                            coupon.is_active ? (
                              <PauseCircle className="size-4" />
                            ) : (
                              <PlayCircle className="size-4" />
                            )
                          }
                        >
                          {coupon.is_active ? "إيقاف" : "تفعيل"}
                        </Button>
                      </form>
                      <ConfirmActionButton
                        action={deleteAction}
                        triggerLabel="حذف"
                        confirmLabel="حذف نهائي"
                        title="حذف الكوبون"
                        description="سيتم حذف الكوبون إذا لم يستخدم في أي طلب، وإيقافه فقط إذا كان مرتبطا بطلبات."
                        itemName={coupon.code}
                        variant="danger"
                        size="sm"
                        icon={<Trash2 className="size-4" />}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ar-OM", {
    dateStyle: "medium"
  }).format(new Date(value));
}

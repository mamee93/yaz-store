import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { CouponForm } from "@/components/admin/coupon-form";
import { updateCouponAction } from "@/features/coupons/actions";
import { getAdminCouponById } from "@/features/coupons/queries";

type AdminEditCouponPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    status?: string;
    message?: string;
  }>;
};

export default async function AdminEditCouponPage({
  params,
  searchParams
}: AdminEditCouponPageProps) {
  const [{ id }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const coupon = await getAdminCouponById(id);

  if (!coupon) {
    notFound();
  }

  const updateAction = updateCouponAction.bind(null, coupon.id);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="الكوبونات"
        title="تعديل كوبون الخصم"
        description={`تحديث إعدادات الكوبون ${coupon.code}، حدود الاستخدام، وتواريخ الصلاحية.`}
      />
      <AdminStatusMessage
        status={resolvedSearchParams.status}
        message={resolvedSearchParams.message}
      />
      <CouponForm mode="edit" coupon={coupon} action={updateAction} />
    </div>
  );
}

function AdminStatusMessage({ status, message }: { status?: string; message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <div
      className={
        status === "error"
          ? "rounded-oud border border-red-900/15 bg-red-900/10 px-4 py-3 text-sm font-semibold text-red-900"
          : "rounded-oud border border-green-900/15 bg-green-900/10 px-4 py-3 text-sm font-semibold text-green-900"
      }
    >
      {message}
    </div>
  );
}

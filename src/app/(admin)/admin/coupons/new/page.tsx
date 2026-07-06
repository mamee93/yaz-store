import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { CouponForm } from "@/components/admin/coupon-form";
import { createCouponAction } from "@/features/coupons/actions";

type AdminNewCouponPageProps = {
  searchParams: Promise<{
    status?: string;
    message?: string;
  }>;
};

export default async function AdminNewCouponPage({ searchParams }: AdminNewCouponPageProps) {
  const params = await searchParams;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="الكوبونات"
        title="إضافة كوبون خصم"
        description="أنشئ كوبونا جديدا وحدد نوع الخصم، الحدود، مدة الصلاحية، وحالة التفعيل."
      />
      <AdminStatusMessage status={params.status} message={params.message} />
      <CouponForm mode="new" action={createCouponAction} />
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

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ShippingZoneForm } from "@/components/admin/shipping-zone-form";
import { createShippingZoneAction } from "@/features/shipping/actions";

type AdminNewShippingPageProps = {
  searchParams: Promise<{
    status?: string;
    message?: string;
  }>;
};

export default async function AdminNewShippingPage({ searchParams }: AdminNewShippingPageProps) {
  const params = await searchParams;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="التوصيل"
        title="إضافة منطقة توصيل"
        description="أضف مدينة أو منطقة جديدة وحدد رسوم التوصيل وحد الشحن المجاني والمدة المتوقعة."
      />
      <AdminStatusMessage status={params.status} message={params.message} />
      <ShippingZoneForm mode="new" action={createShippingZoneAction} />
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

import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ShippingZoneForm } from "@/components/admin/shipping-zone-form";
import { updateShippingZoneAction } from "@/features/shipping/actions";
import { getAdminShippingZoneById } from "@/features/shipping/queries";

type AdminEditShippingPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    status?: string;
    message?: string;
  }>;
};

export default async function AdminEditShippingPage({
  params,
  searchParams
}: AdminEditShippingPageProps) {
  const [{ id }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const zone = await getAdminShippingZoneById(id);

  if (!zone) {
    notFound();
  }

  const updateAction = updateShippingZoneAction.bind(null, zone.id);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="التوصيل"
        title="تعديل منطقة التوصيل"
        description={`تحديث رسوم ومدة التوصيل لمنطقة ${zone.name}.`}
      />
      <AdminStatusMessage
        status={resolvedSearchParams.status}
        message={resolvedSearchParams.message}
      />
      <ShippingZoneForm mode="edit" zone={zone} action={updateAction} />
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

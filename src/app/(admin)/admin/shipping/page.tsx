import Link from "next/link";
import { Plus } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ShippingStatsCards } from "@/components/admin/shipping-stats-cards";
import { ShippingZonesTable } from "@/components/admin/shipping-zones-table";
import { Button, Input } from "@/components/ui";
import { getAdminShippingStats, getAdminShippingZones } from "@/features/shipping/queries";

type AdminShippingPageProps = {
  searchParams: Promise<{
    q?: string;
    status?: string;
    message?: string;
  }>;
};

export default async function AdminShippingPage({ searchParams }: AdminShippingPageProps) {
  const params = await searchParams;
  const [zones, stats] = await Promise.all([
    getAdminShippingZones(params.q),
    getAdminShippingStats()
  ]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="التوصيل"
        title="إعدادات التوصيل"
        description="إدارة مناطق التوصيل، الرسوم، حدود الشحن المجاني، والمدة المتوقعة لكل منطقة."
        action={
          <Link href="/admin/shipping/new">
            <Button leftIcon={<Plus className="size-4" />}>إضافة منطقة</Button>
          </Link>
        }
      />
      <AdminStatusMessage status={params.status} message={params.message} />
      <ShippingStatsCards stats={stats} />
      <ShippingSearchForm defaultValue={params.q} />
      <ShippingZonesTable zones={zones} />
    </div>
  );
}

function ShippingSearchForm({ defaultValue }: { defaultValue?: string }) {
  return (
    <form
      action="/admin/shipping"
      className="flex flex-col gap-2 rounded-oud border border-oud-brown/10 bg-oud-pearl p-4 shadow-none sm:flex-row"
    >
      <Input
        name="q"
        defaultValue={defaultValue ?? ""}
        placeholder="بحث باسم المنطقة أو المدينة"
        aria-label="بحث مناطق التوصيل"
        className="bg-white"
      />
      <Button type="submit" variant="secondary">
        بحث
      </Button>
    </form>
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

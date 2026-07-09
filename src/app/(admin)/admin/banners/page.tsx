import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { BannerManagement } from "@/components/admin/banner-management";
import { StatusMessage } from "@/components/admin/status-message";
import { getAdminBanners } from "@/features/banners/queries";

type AdminBannersPageProps = {
  searchParams: Promise<{
    status?: string;
    message?: string;
  }>;
};

export default async function AdminBannersPage({ searchParams }: AdminBannersPageProps) {
  const [banners, params] = await Promise.all([getAdminBanners(), searchParams]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="البنرات"
        title="إدارة البنرات"
        description="إضافة وتعديل بنرات الرئيسية والعروض مع رفع الصور من الهاتف أو الكمبيوتر."
      />
      <StatusMessage status={params.status} message={params.message} />
      <BannerManagement banners={banners} />
    </div>
  );
}

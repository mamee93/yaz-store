import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { BannerManagement } from "@/components/admin/banner-management";

export default function AdminBannersPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="البنرات"
        title="إدارة البنرات"
        description="جدول ونموذج ثابتان لبنرات الرئيسية والعروض."
      />
      <BannerManagement />
    </div>
  );
}

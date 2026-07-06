import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { SettingsForm } from "@/components/admin/settings-form";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="الإعدادات"
        title="إعدادات المتجر"
        description="نماذج ثابتة لهوية المتجر، التواصل، السياسات، والسيو."
      />
      <SettingsForm />
    </div>
  );
}

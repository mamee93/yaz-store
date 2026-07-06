import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { StoreSettingsForm } from "@/components/admin/store-settings-form";
import { StoreStatusCard } from "@/components/admin/store-status-card";
import { getAdminStoreSettings } from "@/features/store-settings/queries";

type AdminSettingsPageProps = {
  searchParams: Promise<{
    status?: string;
    message?: string;
  }>;
};

export default async function AdminSettingsPage({ searchParams }: AdminSettingsPageProps) {
  const [settings, params] = await Promise.all([getAdminStoreSettings(), searchParams]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="الإعدادات"
        title="إعدادات المتجر"
        description="إدارة هوية المتجر، التواصل، حالة استقبال الطلبات، الحد الأدنى، الضريبة، والعملة."
      />
      <AdminStatusMessage status={params.status} message={params.message} />
      <StoreStatusCard settings={settings} />
      <StoreSettingsForm settings={settings} />
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

import { redirect } from "next/navigation";
import { AdminShell } from "@/components/layout/admin-shell";
import { requireAdmin } from "@/features/auth/queries";
import { getAdminStoreSettings } from "@/features/store-settings/queries";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const [admin, settings] = await Promise.all([requireAdmin(), getAdminStoreSettings()]);

  if (!admin) {
    redirect("/admin/login");
  }

  const storeName = settings?.store_name ?? settings?.store_name_ar ?? undefined;
  const logoUrl = settings?.logo_url?.trim() || null;

  return (
    <AdminShell storeName={storeName} logoUrl={logoUrl}>
      {children}
    </AdminShell>
  );
}

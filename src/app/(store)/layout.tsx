import { StoreShell } from "@/components/layout/store-shell";
import { getCurrentAdmin, getCurrentCustomer } from "@/features/auth/queries";
import { getStoreSettings } from "@/features/store-settings/queries";

export const dynamic = "force-dynamic";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [settings, admin, customer] = await Promise.all([
    getStoreSettings(),
    getCurrentAdmin(),
    getCurrentCustomer()
  ]);

  return (
    <StoreShell settings={settings} customer={admin ? null : customer} admin={admin}>
      {children}
    </StoreShell>
  );
}

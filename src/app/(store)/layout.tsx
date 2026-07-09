import { StoreShell } from "@/components/layout/store-shell";
import { getCurrentCustomer } from "@/features/auth/queries";
import { getStoreSettings } from "@/features/store-settings/queries";

export const dynamic = "force-dynamic";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [settings, customer] = await Promise.all([getStoreSettings(), getCurrentCustomer()]);

  return (
    <StoreShell settings={settings} customer={customer}>
      {children}
    </StoreShell>
  );
}

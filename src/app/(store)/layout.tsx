import { StoreShell } from "@/components/layout/store-shell";
import { getStoreSettings } from "@/features/store-settings/queries";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const settings = await getStoreSettings();

  return <StoreShell settings={settings}>{children}</StoreShell>;
}

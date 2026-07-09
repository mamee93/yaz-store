import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";
import type { StoreSettingsRead } from "@/features/store-settings/queries";
import type { AdminProfile, CustomerProfile } from "@/features/auth/queries";

type StoreShellProps = {
  children: React.ReactNode;
  settings?: StoreSettingsRead | null;
  customer?: CustomerProfile | null;
  admin?: AdminProfile | null;
};

export function StoreShell({ children, settings, customer, admin }: StoreShellProps) {
  const storeName = settings?.store_name ?? settings?.store_name_ar ?? undefined;
  const description = settings?.store_description ?? settings?.brand_story_ar ?? null;
  const logoUrl = settings?.logo_url?.trim() || null;

  return (
    <div className="min-h-screen bg-oud-ivory text-oud-ink">
      <SiteHeader storeName={storeName} logoUrl={logoUrl} customer={customer} admin={admin} />
      <main>{children}</main>
      <SiteFooter storeName={storeName} description={description} logoUrl={logoUrl} />
    </div>
  );
}

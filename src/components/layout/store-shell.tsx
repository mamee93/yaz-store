import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";
import type { StoreSettingsRead } from "@/features/store-settings/queries";

type StoreShellProps = {
  children: React.ReactNode;
  settings?: StoreSettingsRead | null;
};

export function StoreShell({ children, settings }: StoreShellProps) {
  const storeName = settings?.store_name ?? settings?.store_name_ar ?? undefined;
  const description = settings?.store_description ?? settings?.brand_story_ar ?? null;

  return (
    <div className="min-h-screen bg-oud-ivory text-oud-ink">
      <SiteHeader storeName={storeName} />
      <main>{children}</main>
      <SiteFooter storeName={storeName} description={description} />
    </div>
  );
}

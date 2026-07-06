import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

type StoreShellProps = {
  children: React.ReactNode;
};

export function StoreShell({ children }: StoreShellProps) {
  return (
    <div className="min-h-screen bg-oud-ivory text-oud-ink">
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
    </div>
  );
}

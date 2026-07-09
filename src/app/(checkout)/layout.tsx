import { SiteHeader } from "@/components/layout/site-header";
import { getCurrentAdmin, getCurrentCustomer } from "@/features/auth/queries";

export const dynamic = "force-dynamic";

export default async function CheckoutLayout({ children }: { children: React.ReactNode }) {
  const [admin, customer] = await Promise.all([getCurrentAdmin(), getCurrentCustomer()]);

  return (
    <>
      <SiteHeader customer={admin ? null : customer} admin={admin} />
      <main>{children}</main>
    </>
  );
}

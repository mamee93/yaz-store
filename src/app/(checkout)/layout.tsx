import { SiteHeader } from "@/components/layout/site-header";
import { getCurrentCustomer } from "@/features/auth/queries";

export const dynamic = "force-dynamic";

export default async function CheckoutLayout({ children }: { children: React.ReactNode }) {
  const customer = await getCurrentCustomer();

  return (
    <>
      <SiteHeader customer={customer} />
      <main>{children}</main>
    </>
  );
}

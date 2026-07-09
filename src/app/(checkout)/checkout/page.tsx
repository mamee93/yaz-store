import { CheckoutClient } from "@/components/checkout/checkout-client";
import { getCurrentCustomer } from "@/features/auth/queries";
import { getStoreSettings } from "@/features/store-settings/queries";

export default async function CheckoutPage() {
  const [settings, customer] = await Promise.all([getStoreSettings(), getCurrentCustomer()]);

  return <CheckoutClient settings={settings} customer={customer} />;
}

import { CheckoutClient } from "@/components/checkout/checkout-client";
import { getCheckoutPrefill } from "@/features/checkout/queries";
import { getStoreSettings } from "@/features/store-settings/queries";

export default async function CheckoutPage() {
  const [settings, prefill] = await Promise.all([getStoreSettings(), getCheckoutPrefill()]);

  return <CheckoutClient settings={settings} prefill={prefill} />;
}

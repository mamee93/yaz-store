import { CheckoutClient } from "@/components/checkout/checkout-client";
import { getStoreSettings } from "@/features/store-settings/queries";

export default async function CheckoutPage() {
  const settings = await getStoreSettings();

  return <CheckoutClient settings={settings} />;
}

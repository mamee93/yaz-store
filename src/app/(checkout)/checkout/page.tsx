import { CheckoutClient } from "@/components/checkout/checkout-client";
import { getCheckoutPrefill } from "@/features/checkout/queries";
import { getStoreSettings } from "@/features/store-settings/queries";
import { getActiveShippingZones } from "@/features/shipping/queries";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CheckoutPage() {
  const [settings, prefill, shippingZones] = await Promise.all([
    getStoreSettings(),
    getCheckoutPrefill(),
    getActiveShippingZones()
  ]);

  return <CheckoutClient settings={settings} prefill={prefill} shippingZones={shippingZones} />;
}

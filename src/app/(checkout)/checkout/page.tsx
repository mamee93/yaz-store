import { CheckoutClient } from "@/components/checkout/checkout-client";
import { getActiveShippingZones } from "@/features/shipping/queries";
import { getStoreSettings } from "@/features/store-settings/queries";

export default async function CheckoutPage() {
  const [shippingZones, settings] = await Promise.all([
    getActiveShippingZones(),
    getStoreSettings()
  ]);

  return <CheckoutClient shippingZones={shippingZones} settings={settings} />;
}

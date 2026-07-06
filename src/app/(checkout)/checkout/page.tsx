import { CheckoutClient } from "@/components/checkout/checkout-client";
import { getActiveShippingZones } from "@/features/shipping/queries";

export default async function CheckoutPage() {
  const shippingZones = await getActiveShippingZones();

  return <CheckoutClient shippingZones={shippingZones} />;
}

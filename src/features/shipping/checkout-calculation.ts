import { getDeliveryFee, type DeliveryMethod } from "@/constants/oman-delivery";
import type { ShippingZoneRow } from "@/features/shipping/queries";

export type CheckoutShippingAddress = {
  governorate?: string | null;
  wilayat?: string | null;
  area?: string | null;
};

export type CheckoutShippingQuote = {
  zone: ShippingZoneRow | null;
  shippingFee: number;
  shippingArea: string | null;
};

export function calculateCheckoutShippingQuote({
  deliveryMethod,
  zones,
  address,
  subtotalAfterDiscount
}: {
  deliveryMethod: DeliveryMethod;
  zones: ShippingZoneRow[];
  address: CheckoutShippingAddress;
  subtotalAfterDiscount: number;
}): CheckoutShippingQuote {
  if (deliveryMethod === "pickup_office") {
    return {
      zone: null,
      shippingFee: 0,
      shippingArea: null
    };
  }

  const zone = findCheckoutShippingZone(zones, address);

  if (!zone) {
    return {
      zone: null,
      shippingFee: Number(getDeliveryFee(deliveryMethod)),
      shippingArea: buildShippingArea(address)
    };
  }

  const freeShippingApplies =
    zone.free_shipping_minimum_omr !== null &&
    subtotalAfterDiscount >= Number(zone.free_shipping_minimum_omr);

  return {
    zone,
    shippingFee: freeShippingApplies ? 0 : Number(zone.delivery_fee_omr),
    shippingArea: [zone.city, zone.area].filter(Boolean).join(" - ")
  };
}

export function findCheckoutShippingZone(
  zones: ShippingZoneRow[],
  address: CheckoutShippingAddress
) {
  const activeZones = zones.filter((zone) => zone.is_active);
  const normalizedWilayat = normalizeAddressPart(address.wilayat);
  const normalizedArea = normalizeAddressPart(address.area);

  if (!normalizedWilayat) {
    return null;
  }

  const exactAreaMatch = activeZones.find(
    (zone) =>
      normalizeAddressPart(zone.city) === normalizedWilayat &&
      normalizeAddressPart(zone.area) === normalizedArea
  );

  if (exactAreaMatch) {
    return exactAreaMatch;
  }

  return (
    activeZones.find(
      (zone) =>
        normalizeAddressPart(zone.city) === normalizedWilayat &&
        normalizeAddressPart(zone.area).length === 0
    ) ??
    activeZones.find((zone) => normalizeAddressPart(zone.city) === normalizedWilayat) ??
    null
  );
}

export function buildShippingArea(address: CheckoutShippingAddress) {
  return [address.governorate, address.wilayat, address.area]
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(" - ");
}

function normalizeAddressPart(value?: string | null) {
  return (value ?? "").trim().replace(/\s+/g, " ").toLocaleLowerCase("ar-OM");
}

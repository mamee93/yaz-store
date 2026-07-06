import { Badge } from "@/components/ui";
import { getShippingStatus, type ShippingZoneRow } from "@/features/shipping/queries";

type ShippingStatusBadgeProps = {
  zone: ShippingZoneRow;
};

const statusLabels = {
  active: "نشط",
  inactive: "متوقف",
  free_available: "شحن مجاني متاح"
};

export function ShippingStatusBadge({ zone }: ShippingStatusBadgeProps) {
  const status = getShippingStatus(zone);

  return <Badge variant={getVariant(status)}>{statusLabels[status]}</Badge>;
}

function getVariant(status: ReturnType<typeof getShippingStatus>) {
  if (status === "free_available") {
    return "gold";
  }

  if (status === "active") {
    return "success";
  }

  return "soft";
}

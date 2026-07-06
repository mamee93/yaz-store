import { Select } from "@/components/ui";
import type { OrderStatusValue } from "@/validations/order-schema";

type OrderStatusSelectProps = {
  defaultValue: OrderStatusValue;
};

export const orderStatusLabels: Record<OrderStatusValue, string> = {
  pending: "قيد التأكيد",
  confirmed: "مؤكد",
  preparing: "قيد التجهيز",
  out_for_delivery: "خرج للتوصيل",
  completed: "مكتمل",
  cancelled: "ملغي"
};

export function OrderStatusSelect({ defaultValue }: OrderStatusSelectProps) {
  return (
    <Select label="الحالة" name="status" defaultValue={defaultValue}>
      {Object.entries(orderStatusLabels).map(([value, label]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </Select>
  );
}

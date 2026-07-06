import { z } from "zod";

const optionalText = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value ?? null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}, z.string().nullable());

const optionalNonNegativeNumber = z.preprocess((value) => {
  if (typeof value === "string" && value.trim() === "") {
    return null;
  }

  return value ?? null;
}, z.coerce.number().min(0, "يجب ألا تكون القيمة سالبة").nullable());

export const shippingZoneSchema = z.object({
  name: z.string().trim().min(1, "اسم منطقة التوصيل مطلوب").max(120, "الاسم طويل جدا"),
  city: z.string().trim().min(1, "المدينة مطلوبة").max(80, "اسم المدينة طويل جدا"),
  area: z.string().trim().min(1, "المنطقة مطلوبة").max(120, "اسم المنطقة طويل جدا"),
  delivery_fee_omr: z.coerce
    .number({ required_error: "رسوم التوصيل مطلوبة", invalid_type_error: "رسوم التوصيل غير صحيحة" })
    .min(0, "رسوم التوصيل لا يمكن أن تكون سالبة"),
  free_shipping_minimum_omr: optionalNonNegativeNumber,
  estimated_delivery_time: optionalText,
  sort_order: z.coerce
    .number({ invalid_type_error: "ترتيب الظهور غير صحيح" })
    .int("ترتيب الظهور يجب أن يكون رقما صحيحا")
    .min(0, "ترتيب الظهور لا يمكن أن يكون سالبا")
    .default(0),
  is_active: z.coerce.boolean().default(false)
});

export type ShippingZoneFormValues = z.infer<typeof shippingZoneSchema>;

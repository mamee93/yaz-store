import { z } from "zod";

const optionalText = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value ?? null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}, z.string().nullable());

const requiredText = (message: string) => z.string().trim().min(1, message);

export const checkoutSchema = z.object({
  fullName: requiredText("الاسم الكامل مطلوب"),
  phone: requiredText("رقم الهاتف مطلوب").min(7, "رقم الهاتف غير صحيح"),
  whatsapp: optionalText,
  email: z.preprocess((value) => {
    if (typeof value !== "string" || value.trim() === "") {
      return null;
    }

    return value.trim();
  }, z.string().email("البريد الإلكتروني غير صحيح").nullable()),
  country: requiredText("الدولة مطلوبة"),
  governorate: requiredText("المحافظة مطلوبة"),
  wilayat: requiredText("الولاية مطلوبة"),
  area: optionalText,
  addressLine: requiredText("العنوان التفصيلي مطلوب"),
  deliveryNotes: optionalText,
  paymentMethod: z.enum(["cash_on_delivery", "bank_transfer", "manual_confirmation"], {
    required_error: "طريقة الدفع مطلوبة",
    invalid_type_error: "طريقة الدفع غير صحيحة"
  }),
  productId: z.array(requiredText("منتج غير صحيح").uuid("منتج غير صحيح")).min(1, "السلة فارغة"),
  quantity: z
    .array(z.coerce.number().int("الكمية يجب أن تكون رقماً صحيحاً").min(1, "الكمية غير صحيحة"))
    .min(1, "السلة فارغة")
});

export type CheckoutFormValues = z.infer<typeof checkoutSchema>;

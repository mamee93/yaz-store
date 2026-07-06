import { z } from "zod";
import { DELIVERY_METHODS, getGovernorateWilayats } from "@/constants/oman-delivery";

const optionalText = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value ?? null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}, z.string().nullable());

const requiredText = (message: string) => z.string().trim().min(1, message);

export const checkoutSchema = z
  .object({
    fullName: requiredText("الاسم الكامل مطلوب"),
    phone: requiredText("رقم الهاتف مطلوب").min(7, "رقم الهاتف غير صحيح"),
    whatsapp: optionalText,
    email: z.preprocess((value) => {
      if (typeof value !== "string" || value.trim() === "") {
        return null;
      }

      return value.trim();
    }, z.string().email("البريد الإلكتروني غير صحيح").nullable()),
    country: requiredText("الدولة مطلوبة").refine((value) => value === "Oman", {
      message: "الدولة يجب أن تكون عمان"
    }),
    governorate: requiredText("المحافظة مطلوبة"),
    wilayat: requiredText("الولاية مطلوبة"),
    area: requiredText("المنطقة مطلوبة"),
    shippingZoneId: z.preprocess((value) => {
      if (typeof value !== "string" || value.trim() === "") {
        return null;
      }

      return value.trim();
    }, z.string().uuid("منطقة التوصيل غير صحيحة").nullable()),
    addressLine: requiredText("العنوان التفصيلي مطلوب"),
    deliveryMethod: z.enum(
      DELIVERY_METHODS.map((method) => method.id) as ["pickup_office", "home_delivery"],
      {
        required_error: "طريقة التوصيل مطلوبة",
        invalid_type_error: "طريقة التوصيل غير صحيحة"
      }
    ),
    deliveryNotes: optionalText,
    couponCode: z.preprocess((value) => {
      if (typeof value !== "string" || value.trim() === "") {
        return null;
      }

      return value.trim().toUpperCase();
    }, z.string().max(40, "كود الخصم طويل جدا").nullable()),
    paymentMethod: z.enum(["cash_on_delivery", "bank_transfer", "manual_confirmation"], {
      required_error: "طريقة الدفع مطلوبة",
      invalid_type_error: "طريقة الدفع غير صحيحة"
    }),
    productId: z
      .array(requiredText("منتج غير صحيح").uuid("منتج غير صحيح"))
      .min(1, "السلة فارغة"),
    quantity: z
      .array(
        z.coerce
          .number()
          .int("الكمية يجب أن تكون رقما صحيحا")
          .min(1, "الكمية غير صحيحة")
      )
      .min(1, "السلة فارغة")
  })
  .superRefine((data, ctx) => {
    const wilayats = getGovernorateWilayats(data.governorate);

    if (wilayats.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["governorate"],
        message: "المحافظة غير صحيحة"
      });
    }

    if (!wilayats.includes(data.wilayat)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["wilayat"],
        message: "الولاية لا تتبع المحافظة المحددة"
      });
    }
  });

export type CheckoutFormValues = z.infer<typeof checkoutSchema>;

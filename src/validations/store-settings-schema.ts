import { z } from "zod";

const optionalText = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value ?? null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}, z.string().nullable());

const optionalUrl = z.preprocess((value) => {
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  return value.trim();
}, z.string().url("الرابط غير صحيح").nullable());

export const storeSettingsSchema = z.object({
  store_name: z.string().trim().min(1, "اسم المتجر مطلوب").max(120, "اسم المتجر طويل جدا"),
  store_description: optionalText,
  store_email: z.preprocess((value) => {
    if (typeof value !== "string" || value.trim() === "") {
      return null;
    }

    return value.trim();
  }, z.string().email("البريد الإلكتروني غير صحيح").nullable()),
  store_phone: optionalText,
  whatsapp_number: optionalText,
  instagram_url: optionalUrl,
  tiktok_url: optionalUrl,
  logo_url: optionalUrl,
  favicon_url: optionalUrl,
  currency_code: z.string().trim().min(1, "رمز العملة مطلوب").max(8).transform((value) => value.toUpperCase()),
  currency_symbol: z.string().trim().min(1, "رمز العملة مطلوب").max(12),
  tax_rate: z.coerce
    .number({ invalid_type_error: "نسبة الضريبة غير صحيحة" })
    .min(0, "نسبة الضريبة لا يمكن أن تكون سالبة")
    .max(100, "نسبة الضريبة لا يمكن أن تتجاوز 100"),
  is_tax_enabled: z.coerce.boolean().default(false),
  is_store_open: z.coerce.boolean().default(false),
  maintenance_message: optionalText,
  order_prefix: z
    .string()
    .trim()
    .min(1, "بادئة الطلب مطلوبة")
    .max(12, "بادئة الطلب طويلة جدا")
    .regex(/^[A-Z0-9_-]+$/i, "بادئة الطلب يجب أن تحتوي على أحرف إنجليزية وأرقام فقط")
    .transform((value) => value.toUpperCase()),
  minimum_order_amount: z.coerce
    .number({ invalid_type_error: "الحد الأدنى للطلب غير صحيح" })
    .min(0, "الحد الأدنى للطلب لا يمكن أن يكون سالبا")
});

export type StoreSettingsFormValues = z.infer<typeof storeSettingsSchema>;

import { z } from "zod";

const optionalText = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value ?? null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}, z.string().nullable());

const optionalDateTime = z.preprocess((value) => {
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  return value;
}, z.string().nullable());

const optionalPositiveNumber = z.preprocess((value) => {
  if (typeof value === "string" && value.trim() === "") {
    return null;
  }

  return value ?? null;
}, z.coerce.number().positive("يجب أن تكون القيمة أكبر من صفر").nullable());

const optionalPositiveInteger = z.preprocess((value) => {
  if (typeof value === "string" && value.trim() === "") {
    return null;
  }

  return value ?? null;
}, z.coerce.number().int("يجب أن يكون الرقم صحيحا").positive("يجب أن تكون القيمة أكبر من صفر").nullable());

export const couponSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(2, "كود الخصم مطلوب")
      .max(40, "كود الخصم طويل جدا")
      .regex(/^[A-Z0-9_-]+$/i, "كود الخصم يجب أن يحتوي على أحرف إنجليزية وأرقام فقط")
      .transform((value) => value.toUpperCase()),
    name: z.string().trim().min(1, "اسم الكوبون مطلوب").max(120, "اسم الكوبون طويل جدا"),
    description: optionalText,
    discount_type: z.enum(["percentage", "fixed"], {
      required_error: "نوع الخصم مطلوب",
      invalid_type_error: "نوع الخصم غير صحيح"
    }),
    discount_value: z.coerce.number({
      required_error: "قيمة الخصم مطلوبة",
      invalid_type_error: "قيمة الخصم غير صحيحة"
    }),
    minimum_order_amount: z.coerce
      .number({ invalid_type_error: "الحد الأدنى غير صحيح" })
      .min(0, "الحد الأدنى لا يمكن أن يكون سالبا")
      .default(0),
    maximum_discount_amount: optionalPositiveNumber,
    usage_limit: optionalPositiveInteger,
    starts_at: optionalDateTime,
    expires_at: optionalDateTime,
    is_active: z.coerce.boolean().default(false)
  })
  .superRefine((value, ctx) => {
    if (value.discount_type === "percentage") {
      if (value.discount_value < 1 || value.discount_value > 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "خصم النسبة يجب أن يكون بين 1 و 100",
          path: ["discount_value"]
        });
      }
    }

    if (value.discount_type === "fixed" && value.discount_value <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "الخصم الثابت يجب أن يكون أكبر من صفر",
        path: ["discount_value"]
      });
    }

    if (value.starts_at && value.expires_at && new Date(value.starts_at) >= new Date(value.expires_at)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "تاريخ البداية يجب أن يكون قبل تاريخ الانتهاء",
        path: ["expires_at"]
      });
    }
  });

export const checkoutCouponSchema = z.object({
  code: z
    .string()
    .trim()
    .max(40, "كود الخصم طويل جدا")
    .transform((value) => value.toUpperCase())
    .nullable()
});

export type CouponFormValues = z.infer<typeof couponSchema>;

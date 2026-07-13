import { z } from "zod";

const optionalText = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value ?? null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}, z.string().nullable());

const requiredText = (message: string) => z.string().trim().min(1, message);

const optionalSlug = optionalText.pipe(
  z
    .string()
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "\u0627\u0644\u0631\u0627\u0628\u0637 \u0627\u0644\u0645\u062E\u062A\u0635\u0631 \u064A\u062C\u0628 \u0623\u0646 \u064A\u062D\u062A\u0648\u064A \u0639\u0644\u0649 \u0623\u062D\u0631\u0641 \u0625\u0646\u062C\u0644\u064A\u0632\u064A\u0629 \u0635\u063A\u064A\u0631\u0629 \u0648\u0623\u0631\u0642\u0627\u0645 \u0648\u0634\u0631\u0637\u0627\u062A \u0641\u0642\u0637"
    )
    .nullable()
);

const requiredNumber = (message: string) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.coerce.number({ invalid_type_error: message, required_error: message })
  );

const optionalPositiveNumber = z.preprocess((value) => {
  if (typeof value === "string" && value.trim() === "") {
    return null;
  }

  return value ?? null;
}, z.coerce.number().positive("يجب أن تكون القيمة أكبر من صفر").nullable());

export const productSchema = z
  .object({
    name_ar: requiredText("اسم المنتج مطلوب"),
    slug: optionalSlug,
    category_id: requiredText("التصنيف مطلوب").uuid("التصنيف غير صحيح"),
    price_omr: requiredNumber("السعر مطلوب").pipe(
      z.number().min(0, "السعر لا يمكن أن يكون سالباً")
    ),
    compare_at_price_omr: z.preprocess((value) => {
      if (typeof value === "string" && value.trim() === "") {
        return null;
      }

      return value ?? null;
    }, z.coerce.number().min(0, "سعر المقارنة لا يمكن أن يكون سالباً").nullable()),
    sku: optionalText,
    stock_quantity: requiredNumber("كمية المخزون مطلوبة").pipe(
      z
        .number()
        .int("كمية المخزون يجب أن تكون رقماً صحيحاً")
        .min(0, "كمية المخزون لا يمكن أن تكون سالبة")
    ),
    low_stock_threshold: requiredNumber("حد المخزون المنخفض مطلوب").pipe(
      z
        .number()
        .int("حد المخزون يجب أن يكون رقماً صحيحاً")
        .min(0, "حد المخزون لا يمكن أن يكون سالباً")
    ),
    short_description_ar: optionalText,
    description_ar: optionalText,
    scent_family: optionalText,
    intensity: optionalText,
    usage_ar: optionalText,
    occasion_ar: optionalText,
    weight_grams: optionalPositiveNumber.pipe(
      z.number().int("الوزن يجب أن يكون رقماً صحيحاً").positive().nullable()
    ),
    volume_ml: optionalPositiveNumber,
    meta_title_ar: optionalText,
    meta_description_ar: optionalText,
    search_keywords_ar: optionalText,
    is_active: z.coerce.boolean().default(false),
    is_featured: z.coerce.boolean().default(false),
    is_best_seller: z.coerce.boolean().default(false),
    is_new_arrival: z.coerce.boolean().default(false)
  })
  .superRefine((value, ctx) => {
    if (
      value.compare_at_price_omr !== null &&
      value.compare_at_price_omr < value.price_omr
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "سعر المقارنة يجب أن يكون أكبر من السعر الأساسي أو مساوياً له",
        path: ["compare_at_price_omr"]
      });
    }
  });

export type ProductFormValues = z.infer<typeof productSchema>;

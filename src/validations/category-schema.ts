import { z } from "zod";

const optionalText = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value ?? null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}, z.string().nullable());

const requiredText = (message: string) => z.string().trim().min(1, message);

export const categorySchema = z.object({
  name_ar: requiredText("اسم التصنيف مطلوب"),
  slug: requiredText("الرابط المختصر مطلوب").regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "الرابط المختصر يجب أن يحتوي على أحرف إنجليزية صغيرة وأرقام وشرطات فقط"
  ),
  description_ar: optionalText,
  image_url: optionalText,
  sort_order: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? 0 : value),
    z.coerce.number({ invalid_type_error: "ترتيب الظهور يجب أن يكون رقماً" })
  ).pipe(
    z
      .number()
      .int("ترتيب الظهور يجب أن يكون رقماً صحيحاً")
      .min(0, "ترتيب الظهور لا يمكن أن يكون سالباً")
  ),
  is_active: z.coerce.boolean().default(false),
  is_featured: z.coerce.boolean().default(false)
});

export type CategoryFormValues = z.infer<typeof categorySchema>;

import { z } from "zod";

export const bannerPlacements = [
  "home_hero",
  "home_secondary",
  "offers",
  "category",
  "categories",
  "seasonal"
] as const;

const optionalText = z.preprocess((value) => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}, z.string().nullable());

export const bannerSchema = z.object({
  title_ar: z.string().trim().min(1, "عنوان البنر مطلوب."),
  subtitle_ar: optionalText,
  link_url: optionalText,
  button_label_ar: optionalText,
  placement: z.enum(bannerPlacements, {
    required_error: "مكان البنر مطلوب.",
    invalid_type_error: "مكان البنر غير صحيح."
  }),
  sort_order: z.coerce
    .number({ invalid_type_error: "ترتيب البنر يجب أن يكون رقما." })
    .int("ترتيب البنر يجب أن يكون رقما صحيحا.")
    .min(0, "ترتيب البنر لا يمكن أن يكون أقل من صفر."),
  is_active: z.preprocess((value) => value === "on" || value === "true", z.boolean())
});

export type BannerFormValues = z.infer<typeof bannerSchema>;

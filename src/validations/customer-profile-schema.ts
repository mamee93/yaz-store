import { z } from "zod";
import { getGovernorateWilayats } from "@/constants/oman-delivery";

const optionalText = z.preprocess((value) => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}, z.string().max(300, "النص طويل جدا.").nullable());

export const customerDeliveryProfileSchema = z
  .object({
    phone: z.string().trim().min(7, "رقم الهاتف غير صحيح.").max(30, "رقم الهاتف طويل جدا."),
    governorate: optionalText,
    wilayat: optionalText,
    area: optionalText,
    detailed_address: optionalText
  })
  .superRefine((data, ctx) => {
    if (!data.governorate && !data.wilayat) {
      return;
    }

    if (!data.governorate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["governorate"],
        message: "اختر المحافظة."
      });
      return;
    }

    const wilayats = getGovernorateWilayats(data.governorate);

    if (wilayats.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["governorate"],
        message: "المحافظة غير صحيحة."
      });
    }

    if (data.wilayat && !wilayats.includes(data.wilayat)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["wilayat"],
        message: "الولاية لا تتبع المحافظة المحددة."
      });
    }
  });

export type CustomerDeliveryProfileValues = z.infer<typeof customerDeliveryProfileSchema>;

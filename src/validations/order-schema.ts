import { z } from "zod";

export const orderStatusSchema = z.enum([
  "pending",
  "confirmed",
  "preparing",
  "out_for_delivery",
  "completed",
  "cancelled"
]);

export const updateOrderSchema = z.object({
  status: orderStatusSchema,
  admin_notes: z.preprocess((value) => {
    if (typeof value !== "string") {
      return value ?? null;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }, z.string().nullable())
});

export type OrderStatusValue = z.infer<typeof orderStatusSchema>;
export type UpdateOrderValues = z.infer<typeof updateOrderSchema>;

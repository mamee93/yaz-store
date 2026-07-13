"use server";

import { redirect } from "next/navigation";
import { createTrackingToken } from "@/features/order-tracking/tokens";
import { findTrackableOrder } from "@/features/order-tracking/queries";

const genericError = "تعذر العثور على طلب مطابق للبيانات المدخلة.";

export async function trackOrderAction(formData: FormData) {
  const identifier = String(formData.get("identifier") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  if (!identifier || !phone) {
    redirectWithError(identifier);
  }

  const order = await findTrackableOrder(identifier, phone);

  if (!order) {
    redirectWithError(identifier);
  }

  const token = createTrackingToken(order.id);
  redirect(`/track-order/${encodeURIComponent(order.order_number)}?t=${encodeURIComponent(token)}`);
}

function redirectWithError(identifier: string): never {
  const params = new URLSearchParams({
    status: "error",
    message: genericError
  });

  if (identifier) {
    params.set("order", identifier);
  }

  redirect(`/track-order?${params.toString()}`);
}

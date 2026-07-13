import type { Database } from "@/types/database";

export type TrackingOrderStatus = Database["public"]["Enums"]["order_status"];

export const trackingStatusMeta: Record<
  TrackingOrderStatus,
  {
    title: string;
    description: string;
  }
> = {
  pending: {
    title: "تم استلام الطلب",
    description: "استلمنا طلبك وسيتم مراجعته قريبًا."
  },
  confirmed: {
    title: "تم تأكيد الطلب",
    description: "تم تأكيد طلبك وبدأت عملية التجهيز."
  },
  preparing: {
    title: "جارٍ تجهيز الطلب",
    description: "يتم تجهيز منتجاتك بعناية."
  },
  out_for_delivery: {
    title: "الطلب قيد التوصيل",
    description: "خرج طلبك للتوصيل."
  },
  completed: {
    title: "تم تسليم الطلب",
    description: "تم تسليم الطلب بنجاح."
  },
  cancelled: {
    title: "تم إلغاء الطلب",
    description: "تم إلغاء الطلب. تواصل معنا للمزيد من التفاصيل."
  }
};

const timelineStatuses: TrackingOrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "out_for_delivery",
  "completed"
];

export function buildCustomerTimeline(status: TrackingOrderStatus) {
  if (status === "cancelled") {
    return [
      {
        status,
        ...trackingStatusMeta.cancelled,
        state: "current" as const
      }
    ];
  }

  const currentIndex = timelineStatuses.indexOf(status);

  return timelineStatuses.map((step, index) => ({
    status: step,
    ...trackingStatusMeta[step],
    state:
      index < currentIndex
        ? ("completed" as const)
        : index === currentIndex
          ? ("current" as const)
          : ("upcoming" as const)
  }));
}

export function getTrackingStatusLabel(status: TrackingOrderStatus) {
  return trackingStatusMeta[status]?.title ?? status;
}

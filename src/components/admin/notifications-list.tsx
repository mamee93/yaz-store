import Link from "next/link";
import { Check, ExternalLink } from "lucide-react";
import { markNotificationReadAction } from "@/features/notifications/actions";
import type { AdminNotification } from "@/features/notifications/queries";
import { Badge, Button, Card, EmptyState } from "@/components/ui";
import { cn } from "@/utils/cn";

type NotificationsListProps = {
  notifications: AdminNotification[];
  compact?: boolean;
};

export function NotificationsList({ notifications, compact = false }: NotificationsListProps) {
  if (notifications.length === 0) {
    return (
      <EmptyState
        title="لا توجد تنبيهات"
        description="ستظهر هنا الطلبات الجديدة والتنبيهات المهمة الخاصة بالمتجر."
      />
    );
  }

  return (
    <div className={cn("space-y-3", compact && "space-y-2")}>
      {notifications.map((notification) => {
        const href = getNotificationHref(notification);
        const typeLabel = getNotificationTypeLabel(notification.type);

        return (
          <Card
            key={notification.id}
            className={cn(
              "shadow-none transition",
              notification.is_read ? "bg-oud-pearl/75" : "border-oud-gold/35 bg-oud-gold/10"
            )}
          >
            <div className={cn("flex flex-col gap-4 p-4", compact && "gap-3 p-3")}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-oud-brown">{notification.title || typeLabel}</h3>
                    {typeLabel ? <Badge variant="soft">{typeLabel}</Badge> : null}
                    <Badge variant={notification.is_read ? "soft" : "gold"}>
                      {notification.is_read ? "مقروء" : "جديد"}
                    </Badge>
                  </div>
                  <p className="text-sm leading-7 text-oud-muted">{notification.message}</p>
                  <p className="text-xs text-oud-muted">
                    {formatNotificationDate(notification.created_at)}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {href ? (
                  <Link
                    href={href}
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-oud-brown/10 bg-white px-3 text-xs font-semibold text-oud-brown transition hover:bg-oud-beige/35"
                  >
                    <ExternalLink className="size-4" aria-hidden="true" />
                    عرض التفاصيل
                  </Link>
                ) : null}
                {!notification.is_read ? (
                  <form action={markNotificationReadAction}>
                    <input type="hidden" name="notificationId" value={notification.id} />
                    <Button
                      type="submit"
                      variant="secondary"
                      size="sm"
                      leftIcon={<Check className="size-4" aria-hidden="true" />}
                    >
                      تعليم كمقروء
                    </Button>
                  </form>
                ) : null}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function getNotificationHref(notification: AdminNotification) {
  if (notification.entity_type === "order" && notification.entity_id) {
    return `/admin/orders/${notification.entity_id}`;
  }

  if (notification.entity_type === "product" && notification.entity_id) {
    return `/admin/products/${notification.entity_id}/edit`;
  }

  if (
    (notification.entity_type === "return" || notification.entity_type === "order_return") &&
    notification.entity_id
  ) {
    return `/admin/returns/${notification.entity_id}`;
  }

  return null;
}

function getNotificationTypeLabel(type: string) {
  if (type === "return.requested") {
    return "طلب إرجاع جديد";
  }

  return null;
}

function formatNotificationDate(value: string) {
  return new Intl.DateTimeFormat("ar-OM", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

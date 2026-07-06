import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import { NotificationBadge } from "@/components/admin/notification-badge";
import { NotificationsList } from "@/components/admin/notifications-list";
import { Button } from "@/components/ui";
import { markAllNotificationsReadAction } from "@/features/notifications/actions";
import {
  getAdminNotifications,
  getUnreadNotificationsCount
} from "@/features/notifications/queries";

export async function NotificationsDropdown() {
  const [notifications, unreadCount] = await Promise.all([
    getAdminNotifications(5),
    getUnreadNotificationsCount()
  ]);

  return (
    <div className="group relative">
      <button
        type="button"
        className="relative inline-flex size-9 items-center justify-center rounded-oud border border-oud-brown/10 bg-white text-oud-brown transition hover:bg-oud-beige/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oud-gold/50 md:size-10"
        aria-label="تنبيهات الإدارة"
      >
        <Bell className="size-4" aria-hidden="true" />
        <NotificationBadge count={unreadCount} />
      </button>

      <div className="invisible absolute left-0 top-12 z-50 w-[min(22rem,calc(100vw-1.5rem))] opacity-0 transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
        <div className="rounded-oud border border-oud-brown/10 bg-oud-pearl p-3 shadow-soft">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-oud-brown">التنبيهات</p>
              <p className="text-xs text-oud-muted">
                {unreadCount > 0 ? `${unreadCount} غير مقروء` : "كل التنبيهات مقروءة"}
              </p>
            </div>
            {unreadCount > 0 ? (
              <form action={markAllNotificationsReadAction}>
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  leftIcon={<CheckCheck className="size-4" aria-hidden="true" />}
                >
                  قراءة الكل
                </Button>
              </form>
            ) : null}
          </div>

          <div className="max-h-[26rem] overflow-y-auto">
            <NotificationsList notifications={notifications} compact />
          </div>

          <Link
            href="/admin/notifications"
            className="mt-3 flex h-10 items-center justify-center rounded-oud bg-oud-brown text-xs font-semibold text-oud-ivory transition hover:bg-oud-coffee"
          >
            عرض كل التنبيهات
          </Link>
        </div>
      </div>
    </div>
  );
}

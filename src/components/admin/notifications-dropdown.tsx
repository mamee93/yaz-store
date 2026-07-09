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

      <div className="invisible fixed left-3 right-3 top-14 z-50 w-auto max-w-[calc(100vw-24px)] opacity-0 transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100 sm:absolute sm:left-0 sm:right-auto sm:top-12 sm:w-[22rem] sm:max-w-[22rem]">
        <div className="overflow-hidden rounded-oud border border-oud-brown/10 bg-oud-pearl p-3 shadow-soft">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold text-oud-brown">التنبيهات</p>
              <p className="text-xs text-oud-muted">
                {unreadCount > 0 ? `${unreadCount} غير مقروء` : "كل التنبيهات مقروءة"}
              </p>
            </div>
            {unreadCount > 0 ? (
              <form action={markAllNotificationsReadAction} className="max-w-full shrink-0">
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

          <div className="max-h-[26rem] overflow-y-auto [&_a]:max-w-full [&_a]:whitespace-normal [&_button]:max-w-full [&_button]:whitespace-normal [&_h3]:break-words [&_p]:break-words">
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

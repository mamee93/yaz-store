import { CheckCheck } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { NotificationsList } from "@/components/admin/notifications-list";
import { Button } from "@/components/ui";
import { markAllNotificationsReadAction } from "@/features/notifications/actions";
import {
  getAdminNotifications,
  getUnreadNotificationsCount
} from "@/features/notifications/queries";

type AdminNotificationsPageProps = {
  searchParams: Promise<{
    status?: string;
    message?: string;
  }>;
};

export default async function AdminNotificationsPage({
  searchParams
}: AdminNotificationsPageProps) {
  const [notifications, unreadCount, params] = await Promise.all([
    getAdminNotifications(),
    getUnreadNotificationsCount(),
    searchParams
  ]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="التنبيهات"
        title="تنبيهات الإدارة"
        description="متابعة الطلبات الجديدة والتنبيهات التشغيلية المهمة لفريق عود ياز."
        action={
          unreadCount > 0 ? (
            <form action={markAllNotificationsReadAction}>
              <Button
                type="submit"
                variant="gold"
                leftIcon={<CheckCheck className="size-4" aria-hidden="true" />}
              >
                تعليم الكل كمقروء
              </Button>
            </form>
          ) : null
        }
      />
      <AdminStatusMessage status={params.status} message={params.message} />
      <NotificationsList notifications={notifications} />
    </div>
  );
}

function AdminStatusMessage({ status, message }: { status?: string; message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <div
      className={
        status === "error"
          ? "rounded-oud border border-red-900/15 bg-red-900/10 px-4 py-3 text-sm font-semibold text-red-900"
          : "rounded-oud border border-green-900/15 bg-green-900/10 px-4 py-3 text-sm font-semibold text-green-900"
      }
    >
      {message}
    </div>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { Check, ExternalLink } from "lucide-react";
import { markCustomerNotificationReadAction } from "@/features/notifications/actions";
import { Badge, Button, Card, Container, EmptyState, Heading, Section } from "@/components/ui";
import { getCustomerAccountOverview } from "@/features/customers/queries";

export const dynamic = "force-dynamic";

type AccountNotificationsPageProps = {
  searchParams: Promise<{
    status?: string;
    message?: string;
  }>;
};

export default async function AccountNotificationsPage({ searchParams }: AccountNotificationsPageProps) {
  const [params, overview] = await Promise.all([searchParams, getCustomerAccountOverview()]);

  if (!overview) {
    redirect("/login?message=يرجى تسجيل الدخول لعرض الإشعارات.");
  }

  return (
    <main dir="rtl">
      <Section>
        <Container className="space-y-6">
          <Heading
            level={1}
            eyebrow="حسابي"
            description="إشعاراتك الخاصة فقط، مثل تحديثات الاسترداد والتنبيهات المرتبطة بحسابك."
          >
            الإشعارات
          </Heading>
          <StatusMessage status={params.status} message={params.message} />

          {overview.recentNotifications.length === 0 ? (
            <Card className="p-5 shadow-none">
              <EmptyState title="لا توجد إشعارات" description="ستظهر إشعارات حسابك هنا عند توفرها." />
            </Card>
          ) : (
            <div className="grid gap-3">
              {overview.recentNotifications.map((notification) => (
                <Card key={notification.id} className="p-4 shadow-none sm:p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-semibold text-oud-brown">{notification.title}</h2>
                        <Badge variant={notification.is_read ? "soft" : "gold"}>
                          {notification.is_read ? "مقروء" : "جديد"}
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm leading-7 text-oud-muted">{notification.message}</p>
                      <p className="mt-2 text-xs text-oud-muted">{formatDate(notification.created_at)}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {notification.link ? (
                        <Link
                          href={notification.link}
                          className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-oud-brown/15 bg-white px-3 text-xs font-semibold text-oud-brown hover:bg-oud-beige/35"
                        >
                          <ExternalLink className="size-4" />
                          فتح الرابط
                        </Link>
                      ) : null}
                      {!notification.is_read ? (
                        <form action={markCustomerNotificationReadAction.bind(null, notification.id)}>
                          <Button
                            type="submit"
                            size="sm"
                            variant="secondary"
                            leftIcon={<Check className="size-4" />}
                          >
                            تعليم كمقروء
                          </Button>
                        </form>
                      ) : null}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Container>
      </Section>
    </main>
  );
}

function StatusMessage({ status, message }: { status?: string; message?: string }) {
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

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ar-OM", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

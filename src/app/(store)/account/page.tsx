import { redirect } from "next/navigation";
import { CalendarDays, PackageCheck, UserRound } from "lucide-react";
import { CustomerLogoutButton } from "@/components/auth/customer-logout-button";
import { Badge, Card, Container, EmptyState, Heading, Price, Section } from "@/components/ui";
import { getCustomerAccount } from "@/features/customers/queries";

export const dynamic = "force-dynamic";

const orderStatusLabels = {
  pending: "قيد التأكيد",
  confirmed: "مؤكد",
  preparing: "قيد التجهيز",
  out_for_delivery: "قيد التوصيل",
  completed: "مكتمل",
  cancelled: "ملغي"
};

export default async function AccountPage() {
  const account = await getCustomerAccount();

  if (!account) {
    redirect("/login?message=يرجى تسجيل الدخول للوصول إلى حسابك.");
  }

  return (
    <main>
      <Section className="pb-6">
        <Container className="space-y-7">
          <Heading
            level={1}
            eyebrow="حسابي"
            description="تابع بيانات حسابك وطلباتك الأخيرة في عود ياز."
          >
            مرحبا {account.profile?.full_name ?? "بك"}
          </Heading>
        </Container>
      </Section>

      <Section className="pt-2">
        <Container>
          <div className="grid gap-5 lg:grid-cols-[22rem_minmax(0,1fr)] lg:items-start">
            <aside className="space-y-4">
              <Card className="p-5">
                <div className="flex items-start gap-3">
                  <span className="grid size-12 shrink-0 place-items-center rounded-oud bg-oud-brown text-oud-gold">
                    <UserRound className="size-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="font-display text-xl font-bold text-oud-brown">
                      {account.profile?.full_name ?? "عميل عود ياز"}
                    </h2>
                    <p className="mt-1 text-sm text-oud-muted" dir="ltr">
                      {account.profile?.email ?? "-"}
                    </p>
                    <p className="mt-1 text-sm text-oud-muted" dir="ltr">
                      {account.profile?.phone || "-"}
                    </p>
                  </div>
                </div>
                <div className="mt-5 flex items-center gap-2 text-xs text-oud-muted">
                  <CalendarDays className="size-4" aria-hidden="true" />
                  منذ {formatDate(account.profile?.created_at)}
                </div>
              </Card>
              <CustomerLogoutButton className="w-full" />
            </aside>

            <Card className="overflow-hidden shadow-none">
              <div className="border-b border-oud-brown/10 p-5">
                <h2 className="font-display text-2xl font-bold text-oud-brown">
                  الطلبات الأخيرة
                </h2>
              </div>

              {account.orders.length > 0 ? (
                <div className="divide-y divide-oud-brown/10">
                  {account.orders.map((order) => (
                    <div
                      key={order.id}
                      className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-semibold text-oud-brown" dir="ltr">
                          {order.order_number}
                        </p>
                        <p className="mt-1 text-xs text-oud-muted">{formatDate(order.created_at)}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <Badge variant={order.status === "cancelled" ? "danger" : "gold"}>
                          {orderStatusLabels[order.status] ?? order.status}
                        </Badge>
                        <Price value={order.total_omr} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-5">
                  <EmptyState
                    title="لا توجد طلبات بعد"
                    description="ستظهر طلباتك هنا بعد إتمام أول طلب من المتجر."
                    icon={<PackageCheck className="size-5" aria-hidden="true" />}
                  />
                </div>
              )}
            </Card>
          </div>
        </Container>
      </Section>
    </main>
  );
}

function formatDate(value?: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("ar-OM", {
    dateStyle: "medium"
  }).format(new Date(value));
}

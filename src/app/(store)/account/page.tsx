import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { CalendarDays, PackageCheck, ReceiptText, Search, UserRound } from "lucide-react";
import { CustomerLogoutButton } from "@/components/auth/customer-logout-button";
import { CustomerDeliveryFields } from "@/components/customer/customer-delivery-fields";
import { Badge, Button, Card, Container, EmptyState, Heading, Price, Section } from "@/components/ui";
import { updateCustomerDeliveryProfileAction } from "@/features/customers/actions";
import { getCustomerAccount } from "@/features/customers/queries";
import { getTrackingStatusLabel } from "@/features/order-tracking/status";
import { getReturnStatusVariant, returnStatusLabels, returnTypeLabels } from "@/features/returns/labels";
import { getCustomerReturns } from "@/features/returns/queries";

export const dynamic = "force-dynamic";

const orderStatusLabels = {
  pending: "قيد التأكيد",
  confirmed: "مؤكد",
  preparing: "قيد التجهيز",
  out_for_delivery: "قيد التوصيل",
  completed: "مكتمل",
  cancelled: "ملغي"
};

type AccountPageProps = {
  searchParams: Promise<{
    status?: string;
    message?: string;
  }>;
};

export default async function AccountPage({ searchParams }: AccountPageProps) {
  const params = await searchParams;
  const account = await getCustomerAccount();

  if (!account) {
    redirect("/login?message=يرجى تسجيل الدخول للوصول إلى حسابك.");
  }

  const returns = await getCustomerReturns();

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
          <AccountStatusMessage status={params.status} message={params.message} />
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

            <div className="min-w-0 space-y-5">
              <Card className="p-5 shadow-none">
                <h2 className="font-display text-2xl font-bold text-oud-brown">
                  بيانات التوصيل الافتراضية
                </h2>
                <p className="mt-2 text-sm leading-7 text-oud-muted">
                  سنستخدم هذه البيانات لتعبئة صفحة إتمام الطلب تلقائيا، ويمكنك تعديلها أثناء الطلب.
                </p>
                <form action={updateCustomerDeliveryProfileAction} className="mt-5 space-y-4">
                  <CustomerDeliveryFields
                    phone={account.profile?.phone}
                    governorate={account.profile?.governorate}
                    wilayat={account.profile?.wilayat}
                    area={account.profile?.area}
                    detailedAddress={account.profile?.detailed_address}
                  />
                  <Button type="submit">حفظ بيانات التوصيل</Button>
                </form>
              </Card>

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
                        <div className="min-w-0">
                          <p className="font-semibold text-oud-brown" dir="ltr">
                            {order.order_number}
                          </p>
                          <p className="mt-1 text-xs text-oud-muted">
                            {formatDate(order.created_at)}
                          </p>
                        </div>
                        <div className="flex flex-col gap-3 sm:items-end">
                          <div className="flex flex-wrap items-center gap-3">
                            <Badge variant={order.status === "cancelled" ? "danger" : "gold"}>
                              {getTrackingStatusLabel(order.status) ??
                                orderStatusLabels[order.status] ??
                                order.status}
                            </Badge>
                            <Price value={order.total_omr} />
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <AccountOrderLink href={`/account/orders/${order.id}`}>
                              <Search className="size-4" aria-hidden="true" />
                              عرض التفاصيل
                            </AccountOrderLink>
                            <AccountOrderLink href={`/account/orders/${order.id}`}>
                              <PackageCheck className="size-4" aria-hidden="true" />
                              تتبع الطلب
                            </AccountOrderLink>
                            {order.invoice_number ? (
                              <span
                                className="inline-flex h-9 items-center rounded-oud bg-oud-beige/35 px-3 text-xs font-semibold text-oud-brown"
                                dir="ltr"
                              >
                                {order.invoice_number}
                              </span>
                            ) : null}
                            {order.invoice_id ? (
                              <AccountOrderLink href={`/account/orders/${order.id}/invoice.pdf`}>
                                <ReceiptText className="size-4" aria-hidden="true" />
                                تحميل الفاتورة
                              </AccountOrderLink>
                            ) : null}
                          </div>
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

              <Card className="overflow-hidden shadow-none">
                <div className="border-b border-oud-brown/10 p-5">
                  <h2 className="font-display text-2xl font-bold text-oud-brown">
                    طلبات الإرجاع
                  </h2>
                </div>

                {returns.length > 0 ? (
                  <div className="divide-y divide-oud-brown/10">
                    {returns.map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-oud-brown" dir="ltr">
                            {item.order_number}
                          </p>
                          <p className="mt-1 text-xs text-oud-muted">
                            {formatDate(item.requested_at)}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={getReturnStatusVariant(item.status)}>
                            {returnStatusLabels[item.status]}
                          </Badge>
                          <Badge variant="soft">{returnTypeLabels[item.return_type]}</Badge>
                          <Price value={item.expected_refund_omr} />
                          <AccountOrderLink href={`/account/returns/${item.id}`}>
                            عرض التفاصيل
                          </AccountOrderLink>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-5">
                    <EmptyState
                      title="لا توجد طلبات إرجاع"
                      description="ستظهر طلبات الإرجاع والاستبدال هنا بعد إرسالها."
                      icon={<PackageCheck className="size-5" aria-hidden="true" />}
                    />
                  </div>
                )}
              </Card>
            </div>
          </div>
        </Container>
      </Section>
    </main>
  );
}

function AccountStatusMessage({ status, message }: { status?: string; message?: string }) {
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

function AccountOrderLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex h-9 items-center justify-center gap-2 rounded-oud border border-oud-brown/15 bg-oud-pearl px-3 text-xs font-semibold text-oud-brown transition hover:bg-oud-beige/45"
    >
      {children}
    </Link>
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

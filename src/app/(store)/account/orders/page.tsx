import Link from "next/link";
import { redirect } from "next/navigation";
import { FileText, PackageCheck, Search } from "lucide-react";
import { Badge, Card, Container, EmptyState, Heading, Price, Section } from "@/components/ui";
import {
  customerOrderStatusLabels,
  customerPaymentMethodLabels,
  getCustomerOrderStatusVariant
} from "@/features/orders/customer-labels";
import { getCustomerAccountOverview } from "@/features/customers/queries";

export const dynamic = "force-dynamic";

export default async function AccountOrdersPage() {
  const overview = await getCustomerAccountOverview();

  if (!overview) {
    redirect("/login?message=يرجى تسجيل الدخول لعرض طلباتك.");
  }

  return (
    <main dir="rtl">
      <Section>
        <Container className="space-y-6">
          <Heading
            level={1}
            eyebrow="حسابي"
            description="كل طلباتك محفوظة هنا ولا تظهر إلا بعد التحقق من جلسة الحساب."
          >
            طلباتي
          </Heading>

          {overview.allOrders.length === 0 ? (
            <Card className="p-5 shadow-none">
              <EmptyState
                title="لا توجد طلبات بعد"
                description="ستظهر طلباتك هنا بعد إتمام أول طلب من المتجر."
                icon={<PackageCheck className="size-5" />}
              />
            </Card>
          ) : (
            <div className="grid gap-4">
              {overview.allOrders.map((order) => (
                <Card key={order.id} className="p-4 shadow-none sm:p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <p className="font-semibold text-oud-brown" dir="ltr">{order.order_number}</p>
                      <p className="mt-1 text-xs text-oud-muted">{formatDate(order.created_at)}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge variant={getCustomerOrderStatusVariant(order.status)}>
                          {customerOrderStatusLabels[order.status]}
                        </Badge>
                        <Badge variant="soft">{customerPaymentMethodLabels[order.payment_method]}</Badge>
                        {order.invoice_number ? <Badge variant="soft">{order.invoice_number}</Badge> : null}
                      </div>
                    </div>
                    <div className="flex flex-col gap-3 lg:items-end">
                      <Price value={order.total_omr} />
                      <div className="flex flex-wrap gap-2">
                        <AccountLink href={`/account/orders/${order.id}`}>
                          <Search className="size-4" />
                          عرض التفاصيل
                        </AccountLink>
                        <AccountLink href={`/account/orders/${order.id}`}>
                          <PackageCheck className="size-4" />
                          تتبع الطلب
                        </AccountLink>
                        {order.invoice_id ? (
                          <AccountLink href={`/account/orders/${order.id}/invoice.pdf`}>
                            <FileText className="size-4" />
                            تحميل الفاتورة
                          </AccountLink>
                        ) : null}
                      </div>
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

function AccountLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md border border-oud-brown/15 bg-white px-3 py-2 text-xs font-semibold text-oud-brown transition hover:bg-oud-beige/35"
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

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Badge, Button, Card, Container, Heading, Price, Section } from "@/components/ui";
import { confirmRefundReceivedAction } from "@/features/returns/actions";
import { getCustomerReturnById } from "@/features/returns/queries";
import { getReturnStatusVariant, refundMethodLabels, returnStatusLabels, returnTypeLabels } from "@/features/returns/labels";

export const dynamic = "force-dynamic";

type CustomerReturnDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string; message?: string }>;
};

export default async function CustomerReturnDetailPage({
  params,
  searchParams
}: CustomerReturnDetailPageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const returnRequest = await getCustomerReturnById(id);

  if (!returnRequest) {
    notFound();
  }

  const canConfirmRefund =
    returnRequest.status === "refunded" && !returnRequest.customer_refund_confirmed_at;

  return (
    <main dir="rtl">
      <Section>
        <Container className="space-y-6">
          <Heading
            level={1}
            eyebrow="تفاصيل طلب الإرجاع"
            description={`مرتجع للطلب ${returnRequest.order.order_number}`}
          >
            طلب الإرجاع
          </Heading>
          <StatusMessage status={query.status} message={query.message} />

          <Card className="p-5 shadow-none">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <Badge variant={getReturnStatusVariant(returnRequest.status)}>
                  {returnStatusLabels[returnRequest.status]}
                </Badge>
                <p className="mt-3 font-semibold text-oud-brown" dir="ltr">
                  {returnRequest.id}
                </p>
              </div>
              <Price value={returnRequest.refund_amount_omr ?? returnRequest.expected_refund_omr} />
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Info label="رقم الطلب" value={returnRequest.order.order_number} dir="ltr" />
              <Info label="النوع" value={returnTypeLabels[returnRequest.return_type]} />
              <Info label="السبب" value={returnRequest.reason} />
              <Info label="التاريخ" value={formatDate(returnRequest.requested_at)} />
              {returnRequest.refund_method ? (
                <Info label="طريقة الاسترداد" value={refundMethodLabels[returnRequest.refund_method]} />
              ) : null}
              {returnRequest.refund_reference ? (
                <Info label="مرجع الاسترداد" value={returnRequest.refund_reference} dir="ltr" />
              ) : null}
            </div>
            {returnRequest.customer_note ? (
              <p className="mt-5 rounded-oud bg-oud-beige/25 p-4 text-sm leading-7 text-oud-muted">
                {returnRequest.customer_note}
              </p>
            ) : null}
          </Card>

          <Card className="p-5 shadow-none">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="font-display text-2xl font-bold text-oud-brown">تفاصيل الاسترداد</h2>
                <p className="mt-1 text-sm text-oud-muted">
                  تظهر هنا بيانات الاسترداد بعد تسجيله من إدارة المتجر.
                </p>
              </div>
              <Badge variant={returnRequest.customer_refund_confirmed_at ? "success" : "soft"}>
                {returnRequest.customer_refund_confirmed_at ? "تم تأكيد الاستلام" : "بانتظار تأكيد العميل"}
              </Badge>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Info
                label="مبلغ الاسترداد"
                value={<Price value={returnRequest.refund_amount_omr ?? 0} />}
              />
              <Info
                label="طريقة الاسترداد"
                value={
                  returnRequest.refund_method
                    ? refundMethodLabels[returnRequest.refund_method]
                    : "لم يتم التحديد"
                }
              />
              <Info
                label="مرجع الاسترداد"
                value={returnRequest.refund_reference || "لا يوجد مرجع"}
                dir={returnRequest.refund_reference ? "ltr" : "rtl"}
              />
              <Info
                label="تاريخ الاسترداد"
                value={returnRequest.refunded_at ? formatDate(returnRequest.refunded_at) : "لم يتم الاسترداد"}
              />
              <Info
                label="حالة التأكيد"
                value={
                  returnRequest.customer_refund_confirmed_at
                    ? `تم التأكيد في ${formatDate(returnRequest.customer_refund_confirmed_at)}`
                    : "لم يتم تأكيد استلام المبلغ بعد"
                }
              />
            </div>

            {canConfirmRefund ? (
              <form action={confirmRefundReceivedAction.bind(null, returnRequest.id)} className="mt-5">
                <Button type="submit">تأكيد استلام المبلغ</Button>
              </form>
            ) : null}
          </Card>

          <Card className="overflow-hidden shadow-none">
            <div className="border-b border-oud-brown/10 p-5">
              <h2 className="font-display text-2xl font-bold text-oud-brown">العناصر</h2>
            </div>
            <div className="divide-y divide-oud-brown/10">
              {returnRequest.items.map((item) => (
                <div key={item.id} className="grid gap-3 p-5 sm:grid-cols-[minmax(0,1fr)_auto]">
                  <div>
                    <p className="font-semibold text-oud-brown">
                      {item.order_item?.product_name_ar_snapshot ?? "منتج"}
                    </p>
                    <p className="mt-1 text-sm text-oud-muted">الكمية: {item.quantity}</p>
                  </div>
                  <Price value={item.line_refund_omr} />
                </div>
              ))}
            </div>
          </Card>

          <Link
            href="/account"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-oud border border-oud-brown/20 bg-oud-pearl px-5 text-sm font-semibold text-oud-brown"
          >
            <ArrowRight className="size-4" aria-hidden="true" />
            العودة للحساب
          </Link>
        </Container>
      </Section>
    </main>
  );
}

function Info({ label, value, dir }: { label: string; value: React.ReactNode; dir?: "rtl" | "ltr" }) {
  return (
    <div className="rounded-oud border border-oud-brown/10 bg-oud-pearl p-4">
      <p className="text-xs font-semibold text-oud-muted">{label}</p>
      <p className="mt-2 font-semibold text-oud-brown" dir={dir}>
        {value}
      </p>
    </div>
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

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, RotateCcw } from "lucide-react";
import { Button, Card, Container, EmptyState, Heading, Input, Price, Section, Select, Textarea } from "@/components/ui";
import { calculateRefundUnit } from "@/features/returns/calculations";
import { requestOrderReturnAction } from "@/features/returns/actions";
import { getCustomerReturnOrder } from "@/features/returns/queries";
import { returnReasonLabels, returnTypeLabels } from "@/features/returns/labels";

export const dynamic = "force-dynamic";

type ReturnRequestPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string; message?: string }>;
};

export default async function ReturnRequestPage({ params, searchParams }: ReturnRequestPageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const data = await getCustomerReturnOrder(id);

  if (!data) {
    notFound();
  }

  const action = requestOrderReturnAction.bind(null, id);

  return (
    <main dir="rtl">
      <Section>
        <Container size="narrow" className="space-y-6">
          <Heading
            level={1}
            eyebrow="طلب إرجاع أو استبدال"
            description={`رقم الطلب ${data.order.order_number}. يتم احتساب المبلغ المتوقع من بيانات الطلب الأصلية.`}
          >
            طلب إرجاع أو استبدال
          </Heading>
          <StatusMessage status={query.status} message={query.message} />

          {!data.eligibility.eligible ? (
            <EmptyState
              title="الطلب غير مؤهل للإرجاع"
              description={data.eligibility.reason}
              action={
                <Link
                  href={`/account/orders/${id}`}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-oud bg-oud-brown px-5 text-sm font-semibold text-oud-ivory"
                >
                  <ArrowRight className="size-4" aria-hidden="true" />
                  العودة للطلب
                </Link>
              }
            />
          ) : (
            <form action={action} className="space-y-5">
              <Card className="grid gap-4 p-5 shadow-none sm:grid-cols-2">
                <Select name="return_type" label="نوع الطلب" required defaultValue="partial_return">
                  {Object.entries(returnTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
                <Select name="reason" label="سبب الإرجاع" required defaultValue="">
                  <option value="" disabled>
                    اختر السبب
                  </option>
                  {returnReasonLabels.map((reason) => (
                    <option key={reason} value={reason}>
                      {reason}
                    </option>
                  ))}
                </Select>
                <Textarea
                  name="customer_note"
                  label="ملاحظة إضافية"
                  className="sm:col-span-2"
                  placeholder="اكتب أي تفاصيل تساعد فريق عود ياز على مراجعة الطلب."
                />
              </Card>

              <Card className="overflow-hidden shadow-none">
                <div className="border-b border-oud-brown/10 p-5">
                  <h2 className="font-display text-2xl font-bold text-oud-brown">المنتجات والكميات</h2>
                  <p className="mt-1 text-sm text-oud-muted">
                    أدخل الكمية المطلوبة لكل منتج. اترك الكمية صفرًا للمنتجات غير المراد إرجاعها.
                  </p>
                </div>
                <div className="divide-y divide-oud-brown/10">
                  {data.order.order_items.map((item) => (
                    <div key={item.id} className="grid gap-4 p-5 sm:grid-cols-[minmax(0,1fr)_8rem] sm:items-center">
                      <div>
                        <p className="font-semibold text-oud-brown">{item.product_name_ar_snapshot}</p>
                        <div className="mt-2 flex flex-wrap gap-3 text-sm text-oud-muted">
                          <span>الكمية المشتراة: {item.quantity}</span>
                          <span>
                            المبلغ المتوقع للوحدة بعد الخصم:{" "}
                            <Price value={calculateRefundUnit(data.order, item)} />
                          </span>
                        </div>
                      </div>
                      <Input
                        name={`quantity_${item.id}`}
                        label="الكمية"
                        type="number"
                        inputMode="numeric"
                        min={0}
                        max={item.quantity}
                        step={1}
                        defaultValue={0}
                      />
                    </div>
                  ))}
                </div>
              </Card>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button type="submit" leftIcon={<RotateCcw className="size-4" aria-hidden="true" />}>
                  إرسال طلب الإرجاع
                </Button>
                <Link
                  href={`/account/orders/${id}`}
                  className="inline-flex h-11 items-center justify-center rounded-oud border border-oud-brown/20 bg-oud-pearl px-5 text-sm font-semibold text-oud-brown"
                >
                  إلغاء
                </Link>
              </div>
            </form>
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

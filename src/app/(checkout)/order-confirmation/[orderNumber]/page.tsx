import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, MessageCircle, PackageCheck } from "lucide-react";
import { ClearCartOnConfirmation } from "@/components/checkout/clear-cart-on-confirmation";
import { Badge, Card, Container, Heading, Price, Section } from "@/components/ui";
import { getOrderByOrderNumber } from "@/features/checkout/queries";

type OrderConfirmationPageProps = {
  params: Promise<{
    orderNumber: string;
  }>;
};

const paymentMethodLabels = {
  cash_on_delivery: "الدفع عند الاستلام",
  bank_transfer: "التحويل البنكي",
  manual_confirmation: "تأكيد عبر واتساب",
  tap_payments: "دفع إلكتروني"
};

const deliveryMethodLabels = {
  pickup_office: "استلام من المكتب",
  home_delivery: "توصيل للمنزل"
};

export default async function OrderConfirmationPage({ params }: OrderConfirmationPageProps) {
  const { orderNumber } = await params;
  const order = await getOrderByOrderNumber(orderNumber);

  if (!order) {
    notFound();
  }

  return (
    <main>
      <ClearCartOnConfirmation />
      <Section className="pb-6">
        <Container>
          <Card className="overflow-hidden">
            <div className="bg-oud-brown p-6 text-oud-ivory md:p-10">
              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div className="space-y-4">
                  <span className="grid size-14 place-items-center rounded-full border border-oud-gold/40 bg-white/5 text-oud-gold">
                    <CheckCircle2 className="size-7" aria-hidden="true" />
                  </span>
                  <Heading
                    level={1}
                    tone="light"
                    description="تم استلام طلبك بنجاح. سيتواصل فريق عود ياز معك لتأكيد التفاصيل قبل التجهيز."
                  >
                    تم استلام طلبك
                  </Heading>
                </div>
                <div className="rounded-oud border border-white/10 bg-white/5 p-4">
                  <p className="text-xs text-oud-beige">رقم الطلب</p>
                  <p className="mt-1 text-2xl font-bold text-oud-gold" dir="ltr">
                    {order.order_number}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-5 p-6 md:grid-cols-3 md:p-8">
              <ConfirmationStat label="الحالة" value="قيد التأكيد" />
              <ConfirmationStat
                label="طريقة الدفع"
                value={paymentMethodLabels[order.payment_method]}
              />
              <ConfirmationStat label="الإجمالي" value={<Price value={order.total_omr} />} />
            </div>
          </Card>
        </Container>
      </Section>

      <Section className="pt-2">
        <Container>
          <div className="grid gap-6 lg:grid-cols-[1fr_24rem] lg:items-start">
            <div className="space-y-4">
              <Card className="p-5">
                <div className="flex gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-oud bg-oud-beige/45 text-oud-brown">
                    <PackageCheck className="size-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h2 className="font-display text-2xl font-bold text-oud-brown">
                      الخطوات التالية
                    </h2>
                    <ul className="mt-4 space-y-3 text-sm leading-7 text-oud-muted">
                      <li>سيتم التواصل معك لتأكيد بيانات الطلب والتوصيل.</li>
                      <li>سيتم توضيح تفاصيل الدفع أو التحويل عند الحاجة.</li>
                      <li>بعد التأكيد يبدأ تجهيز الطلب للتوصيل.</li>
                    </ul>
                  </div>
                </div>
              </Card>

              <Card className="p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <Badge variant="gold">دعم سريع</Badge>
                    <h2 className="mt-3 font-display text-2xl font-bold text-oud-brown">
                      هل تحتاج تعديلاً على الطلب؟
                    </h2>
                    <p className="mt-2 text-sm leading-7 text-oud-muted">
                      تواصل معنا واذكر رقم الطلب حتى نراجع التفاصيل بسرعة.
                    </p>
                  </div>
                  <Link
                    href="/contact"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-oud bg-oud-brown px-6 text-sm font-semibold text-oud-ivory"
                  >
                    <MessageCircle className="size-4" aria-hidden="true" />
                    تواصل معنا
                  </Link>
                </div>
              </Card>
            </div>

            <aside className="lg:sticky lg:top-24">
              <OrderReceipt order={order} />
            </aside>
          </div>
        </Container>
      </Section>
    </main>
  );
}

function OrderReceipt({ order }: { order: NonNullable<Awaited<ReturnType<typeof getOrderByOrderNumber>>> }) {
  return (
    <Card className="p-5">
      <h2 className="font-display text-2xl font-bold text-oud-brown">ملخص الطلب</h2>
      <div className="mt-5 space-y-4">
        {order.order_items.map((item) => (
          <div key={item.id} className="flex gap-3 border-b border-oud-brown/10 pb-4 last:border-0">
            <div
              className="size-16 shrink-0 rounded-oud border border-oud-brown/10 bg-oud-beige/45"
              style={
                item.product_image_url_snapshot
                  ? { background: `url("${item.product_image_url_snapshot}") center/cover` }
                  : undefined
              }
              aria-hidden="true"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-oud-brown">
                {item.product_name_ar_snapshot}
              </p>
              <p className="mt-1 text-xs text-oud-muted">الكمية: {item.quantity}</p>
            </div>
            <Price value={item.line_total_omr} className="text-sm" />
          </div>
        ))}
      </div>

      <div className="mt-5 space-y-3 border-t border-oud-brown/10 pt-5 text-sm">
        <SummaryRow label="المجموع الفرعي" value={<Price value={order.subtotal_omr} />} />
        <SummaryRow
          label={order.delivery_method ? deliveryMethodLabels[order.delivery_method] : "التوصيل"}
          value={<Price value={order.delivery_fee_omr} />}
        />
        {order.coupon_code ? (
          <SummaryRow label="كود الخصم" value={<span dir="ltr">{order.coupon_code}</span>} />
        ) : null}
        <SummaryRow label="الخصم" value={<Price value={order.discount_omr} />} />
        <SummaryRow label="الضريبة" value={<Price value={order.tax_omr} />} />
        <SummaryRow label="الإجمالي" value={<Price value={order.total_omr} className="text-lg" />} />
      </div>
    </Card>
  );
}

function SummaryRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-oud-muted">{label}</span>
      {value}
    </div>
  );
}

function ConfirmationStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-oud border border-oud-brown/10 bg-oud-beige/25 p-4">
      <p className="text-xs text-oud-muted">{label}</p>
      <div className="mt-2 text-sm font-bold text-oud-brown">{value}</div>
    </div>
  );
}

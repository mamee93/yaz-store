import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { MessageCircle, ReceiptText, RotateCcw } from "lucide-react";
import { OrderTrackingResult } from "@/components/storefront/order-tracking-result";
import { Badge, Card, Container, Heading, Price, Section } from "@/components/ui";
import { getCustomerOrderDetail } from "@/features/order-tracking/queries";
import { getCustomerReturnOrder } from "@/features/returns/queries";
import { getStoreSettings } from "@/features/store-settings/queries";
import type { Json } from "@/types/database";

export const dynamic = "force-dynamic";

type CustomerOrderPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    status?: string;
    message?: string;
  }>;
};

export default async function CustomerOrderPage({ params, searchParams }: CustomerOrderPageProps) {
  const [{ id }, query, settings] = await Promise.all([params, searchParams, getStoreSettings()]);
  const [order, returnInfo] = await Promise.all([
    getCustomerOrderDetail(id),
    getCustomerReturnOrder(id)
  ]);

  if (!order) {
    notFound();
  }

  return (
    <main dir="rtl">
      <Section>
        <Container className="space-y-6">
          <Heading
            level={1}
            eyebrow="تفاصيل الطلب"
            description="تفاصيل طلبك محفوظة لك فقط بعد التحقق من جلسة الحساب."
          >
            الطلب {order.order_number}
          </Heading>

          <StatusMessage status={query.status} message={query.message} />

          <OrderTrackingResult
            order={order}
            whatsappNumber={settings?.whatsapp_number}
            showMaskedCustomer={false}
          />

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <Card className="overflow-hidden shadow-none">
              <div className="border-b border-oud-brown/10 p-5">
                <h2 className="font-display text-2xl font-bold text-oud-brown">المنتجات</h2>
              </div>
              <div className="divide-y divide-oud-brown/10">
                {order.order_items.map((item) => (
                  <div key={item.id} className="flex gap-4 p-5">
                    <div className="relative size-16 shrink-0 overflow-hidden rounded-oud bg-oud-pearl">
                      {item.product_image_url_snapshot ? (
                        <Image
                          src={item.product_image_url_snapshot}
                          alt={item.product_name_ar_snapshot}
                          fill
                          unoptimized
                          sizes="64px"
                          className="object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-oud-brown">{item.product_name_ar_snapshot}</p>
                      {item.sku_snapshot ? (
                        <p className="mt-1 text-xs text-oud-muted" dir="ltr">
                          {item.sku_snapshot}
                        </p>
                      ) : null}
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-oud-muted">
                        <span>الكمية: {item.quantity}</span>
                        <span>
                          السعر: <Price value={item.unit_price_omr} />
                        </span>
                        <span className="font-semibold text-oud-brown">
                          الإجمالي: <Price value={item.line_total_omr} />
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <aside className="space-y-5">
              <Card className="p-5 shadow-none">
                <h2 className="font-display text-xl font-bold text-oud-brown">ملخص الدفع</h2>
                <div className="mt-4 space-y-3 text-sm">
                  <SummaryRow label="المجموع الفرعي" value={<Price value={order.subtotal_omr} />} />
                  <SummaryRow label="الشحن" value={<Price value={order.delivery_fee_omr} />} />
                  <SummaryRow label="الخصم" value={<Price value={order.discount_omr} />} />
                  <SummaryRow label="الضريبة" value={<Price value={order.tax_omr} />} />
                  <div className="flex items-center justify-between border-t border-oud-brown/10 pt-3 text-base font-bold text-oud-brown">
                    <span>الإجمالي</span>
                    <Price value={order.total_omr} />
                  </div>
                </div>
              </Card>

              <Card className="p-5 shadow-none">
                <h2 className="font-display text-xl font-bold text-oud-brown">بيانات التوصيل</h2>
                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-oud-muted">
                  {formatDeliveryAddress(order.delivery_address_snapshot)}
                </p>
              </Card>

              <Card className="space-y-3 p-5 shadow-none">
                <h2 className="font-display text-xl font-bold text-oud-brown">الفاتورة والدعم</h2>
                {order.invoice_id ? (
                  <LinkButton href={`/account/orders/${order.id}/invoice.pdf`}>
                    <ReceiptText className="size-4" aria-hidden="true" />
                    تحميل الفاتورة
                  </LinkButton>
                ) : (
                  <Badge variant="soft">لا توجد فاتورة بعد</Badge>
                )}
                {settings?.whatsapp_number ? (
                  <LinkButton href={getWhatsappHref(settings.whatsapp_number, order.order_number)} variant="secondary">
                    <MessageCircle className="size-4" aria-hidden="true" />
                    تواصل معنا
                  </LinkButton>
                ) : null}
                {returnInfo?.openReturn ? (
                  <LinkButton href={`/account/returns/${returnInfo.openReturn.id}`} variant="secondary">
                    <RotateCcw className="size-4" aria-hidden="true" />
                    عرض طلب الإرجاع
                  </LinkButton>
                ) : returnInfo?.eligibility.eligible ? (
                  <LinkButton href={`/account/orders/${order.id}/return`} variant="secondary">
                    <RotateCcw className="size-4" aria-hidden="true" />
                    طلب إرجاع أو استبدال
                  </LinkButton>
                ) : returnInfo ? (
                  <p className="rounded-oud bg-oud-beige/25 p-3 text-xs leading-6 text-oud-muted">
                    {returnInfo.eligibility.reason}
                  </p>
                ) : null}
              </Card>
            </aside>
          </div>
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

function SummaryRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-oud-muted">{label}</span>
      <span className="font-semibold text-oud-brown">{value}</span>
    </div>
  );
}

function LinkButton({
  href,
  children,
  variant = "primary"
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
}) {
  return (
    <Link
      href={href}
      className={
        variant === "primary"
          ? "inline-flex h-11 w-full items-center justify-center gap-2 rounded-oud bg-oud-brown px-4 text-sm font-semibold text-oud-ivory hover:bg-oud-coffee"
          : "inline-flex h-11 w-full items-center justify-center gap-2 rounded-oud border border-oud-brown/20 bg-oud-pearl px-4 text-sm font-semibold text-oud-brown hover:bg-oud-beige/45"
      }
    >
      {children}
    </Link>
  );
}

function formatDeliveryAddress(value: Json) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return "لا توجد بيانات توصيل محفوظة.";
  }

  const address = value as Record<string, Json>;
  const parts = [
    address.governorate,
    address.wilayat,
    address.area,
    address.address_line_1,
    address.addressLine1,
    address.detailed_address,
    address.detailedAddress
  ]
    .filter((part): part is string => typeof part === "string" && part.trim().length > 0)
    .map((part) => part.trim());

  return parts.length > 0 ? parts.join("\n") : "لا توجد بيانات توصيل محفوظة.";
}

function getWhatsappHref(phone: string, orderNumber: string) {
  const digits = phone.replace(/[^\d]/g, "");
  const normalized = digits.startsWith("968") ? digits : `968${digits}`;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(`أحتاج مساعدة بخصوص الطلب ${orderNumber}`)}`;
}

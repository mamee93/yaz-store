import Link from "next/link";
import { CalendarDays, Hash, Phone, User } from "lucide-react";
import { InvoiceActions } from "@/components/admin/invoice-actions";
import { Card, Price } from "@/components/ui";
import { generateCode128Svg, generateQrSvg } from "@/features/invoices/codes";
import type { AdminInvoice } from "@/features/invoices/queries";
import { getOrderTrackingUrl } from "@/features/order-tracking/url";

type InvoiceDocumentProps = {
  invoice: AdminInvoice;
  showActions?: boolean;
};

export function InvoiceDocument({ invoice, showActions = true }: InvoiceDocumentProps) {
  const order = invoice.order;
  const trackingUrl = getOrderTrackingUrl(order.order_number);

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <style>
        {`
          @page {
            size: A4;
            margin: 10mm;
          }

          @media print {
            html,
            body {
              background: #fff !important;
              direction: rtl;
            }

            aside,
            nav,
            header,
            .admin-sidebar,
            .admin-header,
            .invoice-actions {
              display: none !important;
            }

            .invoice-paper {
              box-shadow: none !important;
              border: 0 !important;
              break-inside: avoid;
              page-break-inside: avoid;
            }

            table,
            tr,
            td,
            th {
              break-inside: avoid;
              page-break-inside: avoid;
            }
          }
        `}
      </style>
      {showActions ? (
        <div className="invoice-actions flex flex-col gap-3 rounded-oud border border-oud-brown/10 bg-oud-pearl p-4 sm:flex-row sm:items-center sm:justify-between">
          <Link href={`/admin/orders/${order.id}`} className="text-sm font-semibold text-oud-brown hover:text-oud-gold">
            العودة إلى الطلب
          </Link>
          <InvoiceActions invoiceId={invoice.id} showView={false} />
        </div>
      ) : null}

      <Card className="invoice-paper overflow-hidden bg-white p-0 shadow-none print:border-0">
        <div className="bg-oud-brown px-6 py-6 text-oud-ivory sm:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-oud-beige">عود ياز</p>
              <h1 className="mt-2 font-display text-4xl font-bold">فاتورة</h1>
              <p className="mt-2 text-sm text-oud-beige">OUD YAZ Professional Invoice</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-oud-beige">رقم الفاتورة</p>
              <p className="mt-1 text-2xl font-bold" dir="ltr">
                {invoice.invoice_number}
              </p>
              <p className="mt-2 text-xs text-oud-beige">{formatDate(invoice.issued_at)}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_16rem]">
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoItem icon={<User className="size-4" />} label="العميل" value={order.customer_name_snapshot} />
              <InfoItem icon={<Phone className="size-4" />} label="الهاتف" value={order.customer_phone_snapshot} dir="ltr" />
              <InfoItem icon={<Hash className="size-4" />} label="رقم الطلب" value={order.order_number} dir="ltr" />
              <InfoItem icon={<CalendarDays className="size-4" />} label="تاريخ الفاتورة" value={formatDate(invoice.issued_at)} />
            </div>

            <div className="overflow-hidden rounded-oud border border-oud-brown/10">
              <table className="w-full text-right text-sm">
                <thead className="bg-oud-beige/35 text-xs text-oud-muted">
                  <tr>
                    <th className="px-4 py-3 font-semibold">المنتج</th>
                    <th className="px-4 py-3 font-semibold">الكمية</th>
                    <th className="px-4 py-3 font-semibold">السعر</th>
                    <th className="px-4 py-3 font-semibold">الإجمالي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-oud-brown/10">
                  {order.order_items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 font-semibold text-oud-brown">{item.product_name_ar_snapshot}</td>
                      <td className="px-4 py-3 text-oud-muted">{item.quantity}</td>
                      <td className="px-4 py-3"><Price value={item.unit_price_omr} /></td>
                      <td className="px-4 py-3"><Price value={item.line_total_omr} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-oud border border-oud-brown/10 bg-oud-pearl p-4 text-center">
              <div dangerouslySetInnerHTML={{ __html: generateQrSvg(trackingUrl, 160) }} />
              <p className="mt-2 text-xs font-semibold text-oud-muted">QR Code للفاتورة</p>
            </div>
            <div className="rounded-oud border border-oud-brown/10 bg-white p-4 text-center">
              <div
                className="h-16 w-full"
                dangerouslySetInnerHTML={{ __html: generateCode128Svg(invoice.invoice_number, 64) }}
              />
              <p className="mt-2 text-xs font-semibold text-oud-muted" dir="ltr">
                {invoice.invoice_number}
              </p>
            </div>
          </aside>
        </div>

        <div className="grid gap-5 border-t border-oud-brown/10 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="rounded-oud bg-oud-beige/25 p-4 text-sm leading-7 text-oud-muted">
            <p className="font-semibold text-oud-brown">ملاحظات الفاتورة</p>
            <p className="mt-1">تم إصدار هذه الفاتورة إلكترونيا من لوحة إدارة عود ياز.</p>
          </div>
          <div className="space-y-3 text-sm">
            <SummaryRow label="المجموع الفرعي" value={<Price value={order.subtotal_omr} />} />
            <SummaryRow label="التوصيل" value={<Price value={order.delivery_fee_omr} />} />
            <SummaryRow label="الخصم" value={<Price value={order.discount_omr} />} />
            <SummaryRow label="الضريبة" value={<Price value={order.tax_omr} />} />
            <div className="flex items-center justify-between border-t border-oud-brown/10 pt-3 text-base font-bold text-oud-brown">
              <span>الإجمالي</span>
              <Price value={order.total_omr} />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function InfoItem({
  icon,
  label,
  value,
  dir
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  dir?: "rtl" | "ltr";
}) {
  return (
    <div className="rounded-oud border border-oud-brown/10 bg-oud-pearl p-3">
      <p className="flex items-center gap-2 text-xs font-semibold text-oud-muted">
        {icon}
        {label}
      </p>
      <p className="mt-2 font-semibold text-oud-brown" dir={dir}>{value}</p>
    </div>
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

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ar-OM", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

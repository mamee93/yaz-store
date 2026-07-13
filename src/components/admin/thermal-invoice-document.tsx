import { generateCode128Svg, generateQrSvg } from "@/features/invoices/codes";
import type { AdminInvoice } from "@/features/invoices/queries";
import { getOrderTrackingUrl } from "@/features/order-tracking/url";

type ThermalInvoiceDocumentProps = {
  invoice: AdminInvoice;
  width: 58 | 80;
};

const paymentMethodLabels = {
  cash_on_delivery: "الدفع عند الاستلام",
  bank_transfer: "تحويل بنكي",
  manual_confirmation: "تأكيد يدوي",
  tap_payments: "دفع إلكتروني"
};

const paymentStatusLabels = {
  pending: "بانتظار الدفع",
  paid: "مدفوع",
  failed: "فشل الدفع",
  refunded: "مسترد",
  cancelled: "ملغي"
};

export function ThermalInvoiceDocument({ invoice, width }: ThermalInvoiceDocumentProps) {
  const order = invoice.order;
  const isSmall = width === 58;
  const qrSize = isSmall ? 92 : 116;
  const trackingUrl = getOrderTrackingUrl(order.order_number);

  return (
    <section
      className="thermal-receipt mx-auto bg-white text-black"
      dir="rtl"
      style={{
        width: isSmall ? "50mm" : "72mm",
        fontFamily: "Arial, sans-serif",
        fontSize: isSmall ? "10px" : "11px",
        lineHeight: 1.45
      }}
    >
      <header className="text-center">
        <h1 className="text-base font-bold">عود ياز</h1>
        <p className="mt-1 text-[10px]">إيصال فاتورة</p>
      </header>

      <Divider />

      <InfoLine label="الفاتورة" value={invoice.invoice_number} dir="ltr" />
      <InfoLine label="الطلب" value={order.order_number} dir="ltr" />
      <InfoLine label="التاريخ" value={formatDate(invoice.issued_at)} />
      <InfoLine label="العميل" value={order.customer_name_snapshot} />
      <InfoLine label="الهاتف" value={order.customer_phone_snapshot} dir="ltr" />

      <Divider />

      <div className="space-y-2">
        {order.order_items.map((item) => (
          <div key={item.id} className="break-inside-avoid">
            <p className="font-bold break-words">{item.product_name_ar_snapshot}</p>
            <div className="flex items-center justify-between gap-2" dir="ltr">
              <span>{item.quantity} x {formatMoney(item.unit_price_omr)}</span>
              <span>{formatMoney(item.line_total_omr)}</span>
            </div>
          </div>
        ))}
      </div>

      <Divider />

      <InfoLine label="المجموع الفرعي" value={formatMoney(order.subtotal_omr)} dir="ltr" />
      <InfoLine label="الخصم" value={formatMoney(order.discount_omr)} dir="ltr" />
      <InfoLine label="التوصيل" value={formatMoney(order.delivery_fee_omr)} dir="ltr" />
      <InfoLine label="الإجمالي النهائي" value={formatMoney(order.total_omr)} strong dir="ltr" />
      <InfoLine label="طريقة الدفع" value={paymentMethodLabels[order.payment_method]} />
      <InfoLine label="حالة الدفع" value={paymentStatusLabels[order.payment_status]} />

      <Divider />

      <div className="grid place-items-center gap-2 text-center">
        <div dangerouslySetInnerHTML={{ __html: generateQrSvg(trackingUrl, qrSize) }} />
        <div
          className="w-full overflow-hidden"
          style={{ height: isSmall ? 42 : 52 }}
          dangerouslySetInnerHTML={{ __html: generateCode128Svg(invoice.invoice_number, isSmall ? 42 : 52) }}
        />
        <p className="text-[9px]" dir="ltr">{invoice.invoice_number}</p>
      </div>

      <Divider />
      <p className="pb-2 text-center font-bold">شكرا لاختياركم عود ياز</p>
    </section>
  );
}

function InfoLine({
  label,
  value,
  strong = false,
  dir
}: {
  label: string;
  value: string;
  strong?: boolean;
  dir?: "rtl" | "ltr";
}) {
  return (
    <div className={strong ? "my-1 flex justify-between gap-2 text-sm font-bold" : "flex justify-between gap-2"}>
      <span>{label}</span>
      <span className="min-w-0 break-words text-left" dir={dir}>{value}</span>
    </div>
  );
}

function Divider() {
  return <div className="my-2 border-t border-dashed border-black" />;
}

function formatMoney(value: number) {
  return `${Number(value).toFixed(3)} ر.ع`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ar-OM", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

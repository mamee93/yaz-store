import Link from "next/link";
import type { ReactNode } from "react";
import { CalendarDays, Check, CreditCard, PackageCheck, Phone, RefreshCw } from "lucide-react";
import { Badge, Card, Price } from "@/components/ui";
import { buildCustomerTimeline, getTrackingStatusLabel } from "@/features/order-tracking/status";
import { maskCustomerName, maskPhone } from "@/features/order-tracking/phone";
import type { PublicTrackableOrder } from "@/features/order-tracking/queries";
import { cn } from "@/utils/cn";

type OrderTrackingResultProps = {
  order: PublicTrackableOrder;
  whatsappNumber?: string | null;
  showMaskedCustomer?: boolean;
};

const paymentMethodLabels = {
  cash_on_delivery: "الدفع عند الاستلام",
  bank_transfer: "تحويل بنكي",
  manual_confirmation: "تأكيد يدوي",
  tap_payments: "دفع إلكتروني"
};

export function OrderTrackingResult({
  order,
  whatsappNumber,
  showMaskedCustomer = true
}: OrderTrackingResultProps) {
  const timeline = buildCustomerTimeline(order.status);
  const whatsappHref = getWhatsappHref(whatsappNumber, order.order_number);

  return (
    <div className="space-y-5" dir="rtl">
      <Card className="overflow-hidden p-0 shadow-none">
        <div className="bg-oud-brown px-5 py-6 text-oud-ivory sm:px-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <Badge variant={order.status === "cancelled" ? "danger" : "gold"}>
                {getTrackingStatusLabel(order.status)}
              </Badge>
              <h1 className="mt-3 font-display text-3xl font-bold">تتبع الطلب</h1>
              <p className="mt-2 text-sm text-oud-beige" dir="ltr">
                {order.order_number}
              </p>
            </div>
            <div className="rounded-oud bg-white/10 px-4 py-3 text-sm">
              <p className="text-oud-beige">الإجمالي</p>
              <p className="mt-1 text-xl font-bold text-white">
                <Price value={order.total_omr} />
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
          <InfoTile icon={<CalendarDays className="size-4" />} label="تاريخ الطلب" value={formatDate(order.created_at)} />
          <InfoTile icon={<RefreshCw className="size-4" />} label="آخر تحديث" value={formatDate(order.updated_at)} />
          <InfoTile icon={<CreditCard className="size-4" />} label="طريقة الدفع" value={paymentMethodLabels[order.payment_method]} />
          <InfoTile icon={<PackageCheck className="size-4" />} label="رقم الفاتورة" value={order.invoice_number ?? "لم تصدر بعد"} dir="ltr" />
          {showMaskedCustomer ? (
            <>
              <InfoTile label="العميل" value={maskCustomerName(order.customer_name_snapshot)} />
              <InfoTile icon={<Phone className="size-4" />} label="الهاتف" value={maskPhone(order.customer_phone_snapshot)} dir="ltr" />
            </>
          ) : null}
        </div>
      </Card>

      <Card className="p-5 shadow-none">
        <h2 className="font-display text-2xl font-bold text-oud-brown">مسار الطلب</h2>
        <div className="mt-5 space-y-4">
          {timeline.map((step) => (
            <div key={step.status} className="flex gap-3">
              <span
                className={cn(
                  "mt-1 grid size-8 shrink-0 place-items-center rounded-full border text-xs font-bold",
                  step.state === "completed" && "border-green-900 bg-green-900 text-white",
                  step.state === "current" && "border-oud-gold bg-oud-gold text-oud-brown",
                  step.state === "upcoming" && "border-oud-brown/10 bg-oud-pearl text-oud-muted"
                )}
              >
                {step.state === "completed" ? <Check className="size-4" /> : null}
              </span>
              <div className={step.state === "upcoming" ? "opacity-55" : undefined}>
                <p className="font-semibold text-oud-brown">{step.title}</p>
                <p className="mt-1 text-sm leading-6 text-oud-muted">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row">
        <LinkButton href="/" variant="secondary">
          الرجوع للمتجر
        </LinkButton>
        {whatsappHref ? (
          <LinkButton href={whatsappHref} variant="primary">
            تواصل عبر واتساب
          </LinkButton>
        ) : null}
      </div>
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
      className={cn(
        "inline-flex h-11 items-center justify-center rounded-oud px-5 text-sm font-semibold transition",
        variant === "primary"
          ? "bg-oud-brown text-oud-ivory hover:bg-oud-coffee"
          : "border border-oud-brown/20 bg-oud-pearl text-oud-brown hover:bg-oud-beige/45"
      )}
    >
      {children}
    </Link>
  );
}

function InfoTile({
  icon,
  label,
  value,
  dir
}: {
  icon?: ReactNode;
  label: string;
  value: ReactNode;
  dir?: "rtl" | "ltr";
}) {
  return (
    <div className="rounded-oud border border-oud-brown/10 bg-oud-pearl p-4">
      <p className="flex items-center gap-2 text-xs font-semibold text-oud-muted">
        {icon}
        {label}
      </p>
      <p className="mt-2 break-words font-semibold text-oud-brown" dir={dir}>
        {value}
      </p>
    </div>
  );
}

function getWhatsappHref(phone: string | null | undefined, orderNumber: string) {
  const digits = phone?.replace(/[^\d]/g, "");

  if (!digits) {
    return null;
  }

  const normalized = digits.startsWith("968") ? digits : `968${digits}`;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(`أحتاج مساعدة بخصوص الطلب ${orderNumber}`)}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ar-OM", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

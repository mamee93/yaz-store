"use client";

import Link from "next/link";
import { CheckCircle2, ShieldCheck, Trash2 } from "lucide-react";
import { Button, Card, Price } from "@/components/ui";
import { getDeliveryFee } from "@/constants/oman-delivery";
import type { CartItem } from "@/stores/cart-store";

type CartSummaryProps = {
  items: CartItem[];
  actionHref?: string;
  actionLabel?: string;
  onClear?: () => void;
};

export function CartSummary({
  items,
  actionHref = "/checkout",
  actionLabel = "إتمام الطلب",
  onClear
}: CartSummaryProps) {
  const hasItems = items.length > 0;
  const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);
  const deliveryFee = hasItems ? getDeliveryFee("home_delivery") : 0;
  const discount = 0;
  const total = Math.max(subtotal + deliveryFee - discount, 0);

  return (
    <Card className="p-4 shadow-none sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-oud-brown sm:text-2xl">ملخص السلة</h2>
          <p className="mt-1 text-xs leading-6 text-oud-muted">
            يتم تأكيد رسوم التوصيل النهائية في صفحة Checkout.
          </p>
        </div>
        <span className="rounded-oud bg-oud-beige/35 px-3 py-1 text-xs font-semibold text-oud-brown">
          {items.length} منتج
        </span>
      </div>

      <div className="mt-5 space-y-3 border-y border-oud-brown/10 py-5 text-sm">
        <SummaryRow label="المجموع الفرعي" value={<Price value={subtotal} />} />
        <SummaryRow label="رسوم التوصيل" value={<Price value={deliveryFee} />} />
        <SummaryRow label="الخصم" value={<Price value={discount} />} />
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 rounded-oud bg-oud-beige/25 p-3">
        <span className="text-base font-bold text-oud-brown">الإجمالي النهائي</span>
        <Price value={total} className="text-xl" />
      </div>

      {hasItems ? (
        <Link
          href={actionHref}
          className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-oud bg-oud-brown px-7 text-base font-semibold text-oud-ivory shadow-soft transition hover:bg-oud-coffee"
        >
          <CheckCircle2 className="size-4" aria-hidden="true" />
          {actionLabel}
        </Link>
      ) : (
        <span className="mt-5 inline-flex h-12 w-full cursor-not-allowed items-center justify-center rounded-oud bg-oud-brown/40 px-7 text-base font-semibold text-oud-ivory">
          {actionLabel}
        </span>
      )}

      {onClear && hasItems ? (
        <Button
          type="button"
          variant="ghost"
          className="mt-2 w-full text-red-900 hover:bg-red-900/10"
          leftIcon={<Trash2 className="size-4" />}
          onClick={onClear}
        >
          إفراغ السلة
        </Button>
      ) : null}

      <div className="mt-4 flex gap-2 rounded-oud bg-oud-beige/35 p-3 text-xs leading-6 text-oud-muted">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-oud-gold" aria-hidden="true" />
        <span>
          سيتم التحقق من الأسعار والمخزون من قاعدة البيانات عند تأكيد الطلب. بإتمام الطلب، أنت توافق على{" "}
          <Link href="/returns-policy" className="font-semibold text-oud-brown underline-offset-4 hover:underline">
            سياسة الاسترجاع والاستبدال
          </Link>
          .
        </span>
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

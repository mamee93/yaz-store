"use client";

import Link from "next/link";
import { ShieldCheck, Trash2 } from "lucide-react";
import { Button, Card, Price } from "@/components/ui";
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
  const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);

  return (
    <Card className="p-4 sm:p-5">
      <h2 className="font-display text-xl font-bold text-oud-brown sm:text-2xl">ملخص الطلب</h2>

      <div className="mt-5 space-y-3 border-y border-oud-brown/10 py-5 text-sm">
        <SummaryRow label="المجموع الفرعي" value={<Price value={subtotal} />} />
        <SummaryRow
          label="رسوم التوصيل"
          value={<span className="font-semibold text-oud-muted">تحدد في checkout</span>}
        />
        <SummaryRow
          label="الخصم"
          value={<span className="font-semibold text-oud-muted">غير مفعل</span>}
        />
      </div>

      <div className="mt-5 flex items-center justify-between">
        <span className="text-base font-bold text-oud-brown">المجموع قبل التوصيل</span>
        <Price value={subtotal} className="text-xl" />
      </div>

      <Link
        href={actionHref}
        className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-oud bg-oud-brown px-7 text-base font-semibold text-oud-ivory shadow-soft transition hover:bg-oud-coffee"
      >
        {actionLabel}
      </Link>

      {onClear ? (
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
        سيتم التحقق من الأسعار والمخزون من قاعدة البيانات عند تأكيد الطلب.
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

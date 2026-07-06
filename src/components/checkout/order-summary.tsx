import Image from "next/image";
import { PackageCheck } from "lucide-react";
import { Card, Price } from "@/components/ui";
import { deliveryFee } from "./static-checkout";
import type { CartItem } from "@/stores/cart-store";

type OrderSummaryProps = {
  items: CartItem[];
};

export function OrderSummary({ items }: OrderSummaryProps) {
  const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);
  const total = subtotal + deliveryFee;

  return (
    <Card className="p-5">
      <h2 className="font-display text-2xl font-bold text-oud-brown">مراجعة الطلب</h2>
      <div className="mt-5 space-y-4">
        {items.map((item) => (
          <div key={item.productId} className="flex gap-3 border-b border-oud-brown/10 pb-4 last:border-0">
            <div
              className="relative size-16 shrink-0 overflow-hidden rounded-oud border border-oud-brown/10"
              style={{ background: item.imageTone }}
            >
              {item.imageUrl ? (
                <Image
                  src={item.imageUrl}
                  alt={item.imageAlt ?? item.name}
                  fill
                  sizes="4rem"
                  className="object-cover"
                />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-oud-brown">{item.name}</p>
              <p className="mt-1 text-xs text-oud-muted">
                الكمية: {item.quantity} · {item.sizeLabel}
              </p>
            </div>
            <Price value={item.price * item.quantity} className="text-sm" />
          </div>
        ))}
      </div>

      <div className="mt-5 space-y-3 border-t border-oud-brown/10 pt-5 text-sm">
        <SummaryRow label="المجموع الفرعي" value={<Price value={subtotal} />} />
        <SummaryRow label="التوصيل" value={<Price value={deliveryFee} />} />
        <SummaryRow label="الإجمالي" value={<Price value={total} className="text-lg" />} />
      </div>

      <div className="mt-5 flex gap-2 rounded-oud bg-oud-beige/35 p-3 text-xs leading-6 text-oud-muted">
        <PackageCheck className="mt-0.5 size-4 shrink-0 text-oud-gold" aria-hidden="true" />
        سيتم تأكيد الطلب والدفع يدوياً بعد مراجعة المنتجات والمخزون.
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

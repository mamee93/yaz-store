"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Badge, Card, Price } from "@/components/ui";
import { useCart } from "@/hooks/use-cart";
import type { CartItem as CartStoreItem } from "@/stores/cart-store";

type CartItemProps = {
  item: CartStoreItem;
  onRemove?: (item: CartStoreItem) => void;
};

export function CartItem({ item, onRemove }: CartItemProps) {
  const { removeItem, setQuantity } = useCart();
  const lineTotal = item.price * item.quantity;

  function decreaseQuantity() {
    if (item.quantity <= 1) {
      return;
    }

    setQuantity(item.productId, item.quantity - 1);
  }

  function handleRemove() {
    removeItem(item.productId);
    onRemove?.(item);
  }

  return (
    <Card className="overflow-hidden p-3 shadow-none sm:p-4">
      <div className="grid min-w-0 gap-4 sm:grid-cols-[7rem_minmax(0,1fr)] lg:grid-cols-[7rem_minmax(0,1fr)_12rem] lg:items-center">
        <Link
          href={`/products/${item.slug}`}
          className="relative aspect-square overflow-hidden rounded-oud border border-oud-brown/10 bg-oud-beige/25"
          style={{ background: item.imageTone }}
          aria-label={item.name}
        >
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.imageAlt ?? item.name}
              fill
              sizes="(min-width: 1024px) 7rem, 34vw"
              className="object-cover"
            />
          ) : null}
        </Link>

        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <Badge variant="gold">{item.category}</Badge>
            <Badge variant="soft">{item.sizeLabel}</Badge>
          </div>

          <Link href={`/products/${item.slug}`} className="block">
            <h2 className="line-clamp-2 break-words text-sm font-bold leading-6 text-oud-brown md:text-base">
              {item.name}
            </h2>
          </Link>

          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <InfoLine label="سعر الوحدة" value={<Price value={item.price} />} />
            <InfoLine label="إجمالي المنتج" value={<Price value={lineTotal} />} strong />
          </div>
        </div>

        <div className="grid min-w-0 gap-3 border-t border-oud-brown/10 pt-3 sm:col-span-2 lg:col-span-1 lg:border-0 lg:pt-0">
          <div className="flex items-center justify-between gap-3 lg:justify-end">
            <span className="text-sm font-semibold text-oud-muted lg:hidden">الكمية</span>
            <div className="inline-flex h-11 items-center overflow-hidden rounded-oud border border-oud-brown/10 bg-oud-pearl">
              <button
                type="button"
                className="grid size-11 place-items-center text-oud-muted transition hover:bg-oud-beige/35 hover:text-oud-brown disabled:cursor-not-allowed disabled:text-oud-muted/35"
                aria-label="تقليل الكمية"
                disabled={item.quantity <= 1}
                onClick={decreaseQuantity}
              >
                <Minus className="size-4" aria-hidden="true" />
              </button>
              <span className="min-w-10 text-center text-sm font-bold tabular-nums text-oud-brown">
                {item.quantity}
              </span>
              <button
                type="button"
                className="grid size-11 place-items-center text-oud-muted transition hover:bg-oud-beige/35 hover:text-oud-brown"
                aria-label="زيادة الكمية"
                onClick={() => setQuantity(item.productId, item.quantity + 1)}
              >
                <Plus className="size-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          <button
            type="button"
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-oud border border-red-900/15 px-3 py-2 text-xs font-semibold text-red-900 transition hover:bg-red-900/10"
            onClick={handleRemove}
          >
            <Trash2 className="size-4" aria-hidden="true" />
            حذف المنتج
          </button>
        </div>
      </div>
    </Card>
  );
}

function InfoLine({
  label,
  value,
  strong = false
}: {
  label: string;
  value: React.ReactNode;
  strong?: boolean;
}) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-2 rounded-oud bg-oud-beige/20 px-3 py-2">
      <span className="text-xs font-semibold text-oud-muted">{label}</span>
      <span className={strong ? "text-sm font-bold text-oud-brown" : "text-sm"}>{value}</span>
    </div>
  );
}

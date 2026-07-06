"use client";

import Image from "next/image";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Badge, Card, Price } from "@/components/ui";
import { useCart } from "@/hooks/use-cart";
import type { CartItem as CartStoreItem } from "@/stores/cart-store";

type CartItemProps = {
  item: CartStoreItem;
};

export function CartItem({ item }: CartItemProps) {
  const { removeItem, setQuantity } = useCart();

  return (
    <Card className="overflow-hidden p-3 sm:p-4">
      <div className="grid grid-cols-[4.75rem_1fr] gap-3 sm:grid-cols-[6.5rem_1fr_auto] sm:gap-4">
        <div
          className="relative aspect-square overflow-hidden rounded-oud border border-oud-brown/10"
          style={{ background: item.imageTone }}
        >
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.imageAlt ?? item.name}
              fill
              sizes="7rem"
              className="object-cover"
            />
          ) : null}
        </div>

        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <Badge variant="gold">{item.category}</Badge>
            <Badge variant="soft">{item.sizeLabel}</Badge>
          </div>
          <h2 className="text-sm font-bold leading-6 text-oud-brown md:text-base">
            {item.name}
          </h2>
          <Price value={item.price} className="text-sm" />
        </div>

        <div className="col-span-2 flex items-center justify-between gap-3 border-t border-oud-brown/10 pt-3 sm:col-span-1 sm:flex-col sm:items-end sm:border-0 sm:pt-0">
          <div className="inline-flex h-10 items-center rounded-oud border border-oud-brown/10 bg-oud-pearl">
            <button
              type="button"
              className="grid size-10 place-items-center text-oud-muted transition hover:text-oud-brown disabled:cursor-not-allowed disabled:text-oud-muted/40"
              aria-label="تقليل الكمية"
              disabled={item.quantity <= 1}
              onClick={() => setQuantity(item.productId, item.quantity - 1)}
            >
              <Minus className="size-4" aria-hidden="true" />
            </button>
            <span className="min-w-8 text-center text-sm font-semibold text-oud-brown">
              {item.quantity}
            </span>
            <button
              type="button"
              className="grid size-10 place-items-center text-oud-muted transition hover:text-oud-brown"
              aria-label="زيادة الكمية"
              onClick={() => setQuantity(item.productId, item.quantity + 1)}
            >
              <Plus className="size-4" aria-hidden="true" />
            </button>
          </div>

          <button
            type="button"
            className="inline-flex items-center gap-2 text-xs font-semibold text-oud-muted transition hover:text-red-900"
            onClick={() => removeItem(item.productId)}
          >
            <Trash2 className="size-4" aria-hidden="true" />
            حذف
          </button>
        </div>
      </div>
    </Card>
  );
}

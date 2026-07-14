"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { CartItem } from "@/components/checkout/cart-item";
import { CartSummary } from "@/components/checkout/cart-summary";
import { Container, EmptyState, Heading, Section } from "@/components/ui";
import { useCart } from "@/hooks/use-cart";
import type { CartItem as CartStoreItem } from "@/stores/cart-store";

export default function CartPage() {
  const { addItem, clearCart, isHydrated, items } = useCart();
  const [removedItem, setRemovedItem] = useState<CartStoreItem | null>(null);

  function handleItemRemoved(item: CartStoreItem) {
    setRemovedItem(item);
    window.setTimeout(() => {
      setRemovedItem((current) => (current?.productId === item.productId ? null : current));
    }, 5000);
  }

  function undoRemove() {
    if (!removedItem) {
      return;
    }

    addItem(removedItem);
    setRemovedItem(null);
  }

  return (
    <main>
      <Section className="pb-6">
        <Container className="space-y-7">
          <Heading
            level={1}
            eyebrow="السلة"
            description="راجع المنتجات المختارة قبل الانتقال إلى بيانات التوصيل والدفع."
          >
            سلة التسوق
          </Heading>
        </Container>
      </Section>

      <Section className="pt-2">
        <Container>
          {!isHydrated ? (
            <CartLoadingState />
          ) : items.length > 0 ? (
            <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start xl:gap-6">
              <div className="min-w-0 space-y-3">
                {items.map((item) => (
                  <CartItem key={item.productId} item={item} onRemove={handleItemRemoved} />
                ))}
                <Link
                  href="/products"
                  className="inline-flex min-h-10 items-center gap-2 rounded-oud border border-oud-brown/10 bg-white px-4 py-2 text-sm font-semibold text-oud-brown transition hover:bg-oud-beige/35"
                >
                  <ArrowRight className="size-4" aria-hidden="true" />
                  متابعة التسوق
                </Link>
              </div>
              <div className="min-w-0 lg:sticky lg:top-24">
                <CartSummary items={items} onClear={clearCart} />
              </div>
            </div>
          ) : (
            <EmptyCartState />
          )}
        </Container>
      </Section>

      {removedItem ? (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center justify-between gap-3 rounded-oud bg-oud-brown px-4 py-3 text-sm text-oud-ivory shadow-soft"
        >
          <span className="min-w-0 truncate">تم حذف المنتج من السلة</span>
          <button
            type="button"
            className="shrink-0 rounded-md bg-white/10 px-3 py-1.5 text-xs font-bold text-oud-gold hover:bg-white/15"
            onClick={undoRemove}
          >
            تراجع
          </button>
        </div>
      ) : null}
    </main>
  );
}

function EmptyCartState() {
  return (
    <EmptyState
      title="سلتك فارغة حاليًا"
      description="ابدأ بإضافة منتجات عود ياز المفضلة لديك، ثم عد إلى هنا لإتمام الطلب."
      icon={<ShoppingBag className="size-5" aria-hidden="true" />}
      action={
        <Link
          href="/products"
          className="inline-flex h-11 items-center justify-center rounded-oud bg-oud-brown px-6 text-sm font-semibold text-oud-ivory"
        >
          متابعة التسوق
        </Link>
      }
    />
  );
}

function CartLoadingState() {
  return (
    <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start xl:gap-6">
      <div className="space-y-3">
        {[0, 1].map((item) => (
          <div key={item} className="rounded-oud border border-oud-brown/10 bg-oud-pearl p-4">
            <div className="grid gap-4 sm:grid-cols-[7rem_minmax(0,1fr)]">
              <div className="aspect-square animate-pulse rounded-oud bg-oud-beige/45" />
              <div className="space-y-3">
                <div className="h-4 w-32 animate-pulse rounded bg-oud-beige/45" />
                <div className="h-5 w-3/4 animate-pulse rounded bg-oud-beige/45" />
                <div className="h-10 w-full animate-pulse rounded-oud bg-oud-beige/35" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-oud border border-oud-brown/10 bg-oud-pearl p-5">
        <div className="h-6 w-36 animate-pulse rounded bg-oud-beige/45" />
        <div className="mt-5 space-y-3">
          <div className="h-4 animate-pulse rounded bg-oud-beige/35" />
          <div className="h-4 animate-pulse rounded bg-oud-beige/35" />
          <div className="h-12 animate-pulse rounded-oud bg-oud-beige/45" />
        </div>
      </div>
    </div>
  );
}

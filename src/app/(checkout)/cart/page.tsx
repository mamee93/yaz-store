"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { CartItem } from "@/components/checkout/cart-item";
import { CartSummary } from "@/components/checkout/cart-summary";
import { Container, EmptyState, Heading, Section } from "@/components/ui";
import { useCart } from "@/hooks/use-cart";

export default function CartPage() {
  const { clearCart, isHydrated, items } = useCart();

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
          {isHydrated && items.length > 0 ? (
            <div className="grid gap-6 lg:grid-cols-[1fr_24rem] lg:items-start">
              <div className="space-y-3">
                {items.map((item) => (
                  <CartItem key={item.productId} item={item} />
                ))}
                <Link
                  href="/products"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-oud-brown underline decoration-oud-gold/45 underline-offset-8"
                >
                  متابعة التسوق
                </Link>
              </div>
              <div className="lg:sticky lg:top-24">
                <CartSummary items={items} onClear={clearCart} />
              </div>
            </div>
          ) : (
            <EmptyCartState />
          )}
        </Container>
      </Section>
    </main>
  );
}

function EmptyCartState() {
  return (
    <EmptyState
      title="السلة فارغة"
      description="لا توجد منتجات في السلة حالياً. اختر منتجاتك من المتجر ثم عد لإتمام الطلب."
      icon={<ShoppingBag className="size-5" aria-hidden="true" />}
      action={
        <Link
          href="/products"
          className="inline-flex h-11 items-center justify-center rounded-oud bg-oud-brown px-6 text-sm font-semibold text-oud-ivory"
        >
          تصفح المنتجات
        </Link>
      }
    />
  );
}

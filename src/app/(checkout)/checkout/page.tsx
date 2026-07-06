"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, ShoppingBag } from "lucide-react";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { OrderSummary } from "@/components/checkout/order-summary";
import { Container, EmptyState, Heading, Section } from "@/components/ui";
import { createCheckoutOrderAction } from "@/features/checkout/actions";
import { useCart } from "@/hooks/use-cart";

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const { isHydrated, items } = useCart();
  const status = searchParams.get("status") ?? undefined;
  const message = searchParams.get("message") ?? undefined;
  const hasItems = isHydrated && items.length > 0;

  return (
    <main>
      <Section className="pb-6">
        <Container className="space-y-7">
          <Heading
            level={1}
            eyebrow="إتمام الطلب"
            description="أدخل بيانات التواصل والتوصيل، ثم اختر طريقة الدفع المناسبة. سيتم تأكيد الطلب يدوياً قبل التجهيز."
          >
            بيانات التوصيل والدفع
          </Heading>
          <CheckoutStatusMessage status={status} message={message} />
        </Container>
      </Section>

      <Section className="pt-2">
        <Container>
          {hasItems ? (
            <div className="grid gap-6 lg:grid-cols-[1fr_24rem] lg:items-start">
              <CheckoutForm action={createCheckoutOrderAction} items={items} />

              <aside className="space-y-4 lg:sticky lg:top-24">
                <OrderSummary items={items} />
                <button
                  type="submit"
                  form="checkout-form"
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-oud bg-oud-brown px-7 text-sm font-semibold text-oud-ivory shadow-soft transition hover:bg-oud-coffee"
                >
                  <CheckCircle2 className="size-4" aria-hidden="true" />
                  تأكيد الطلب
                </button>
                <p className="text-center text-xs leading-6 text-oud-muted">
                  سيتم إنشاء الطلب بحالة قيد التأكيد، ولن يتم خصم المخزون حتى يؤكده فريق عود ياز.
                </p>
              </aside>
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

function CheckoutStatusMessage({ status, message }: { status?: string; message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <div
      className={
        status === "error"
          ? "rounded-oud border border-red-900/15 bg-red-900/10 px-4 py-3 text-sm font-semibold text-red-900"
          : "rounded-oud border border-green-900/15 bg-green-900/10 px-4 py-3 text-sm font-semibold text-green-900"
      }
    >
      {message}
    </div>
  );
}

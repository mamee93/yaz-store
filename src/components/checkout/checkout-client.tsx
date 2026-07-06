"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, ShoppingBag, Truck } from "lucide-react";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { OrderSummary } from "@/components/checkout/order-summary";
import { Container, EmptyState, Heading, Section } from "@/components/ui";
import {
  validateCheckoutCouponAction,
  type CouponValidationState
} from "@/features/coupons/actions";
import { createCheckoutOrderAction } from "@/features/checkout/actions";
import type { ShippingZoneRow } from "@/features/shipping/queries";
import type { StoreSettingsRead } from "@/features/store-settings/queries";
import { useCart } from "@/hooks/use-cart";

type CheckoutClientProps = {
  shippingZones: ShippingZoneRow[];
  settings: StoreSettingsRead | null;
};

const initialCouponState: CouponValidationState = {
  status: "idle",
  code: null,
  message: null,
  discountAmount: 0,
  subtotal: 0,
  total: 0,
  cartSignature: ""
};

export function CheckoutClient({ shippingZones, settings }: CheckoutClientProps) {
  const searchParams = useSearchParams();
  const { isHydrated, items } = useCart();
  const [selectedShippingZoneId, setSelectedShippingZoneId] = useState("");
  const [couponState, couponAction, isCouponPending] = useActionState(
    validateCheckoutCouponAction,
    initialCouponState
  );
  const status = searchParams.get("status") ?? undefined;
  const message = searchParams.get("message") ?? undefined;
  const hasItems = isHydrated && items.length > 0;
  const cartSignature = getCartSignature(items);
  const activeCouponState =
    couponState.status === "success" && couponState.cartSignature === cartSignature
      ? couponState
      : initialCouponState;
  const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);
  const discount = activeCouponState.status === "success" ? activeCouponState.discountAmount : 0;
  const subtotalAfterDiscount = Math.max(0, subtotal - discount);
  const minimumOrderAmount = settings?.minimum_order_amount ?? 0;
  const isBelowMinimum = subtotalAfterDiscount < minimumOrderAmount;
  const canSubmit = Boolean(selectedShippingZoneId) && !isBelowMinimum;

  return (
    <main>
      <Section className="pb-6">
        <Container className="space-y-7">
          <Heading
            level={1}
            eyebrow="إتمام الطلب"
            description="أدخل بيانات التواصل والتوصيل، ثم اختر طريقة الدفع المناسبة. سيتم تأكيد الطلب يدويا قبل التجهيز."
          >
            بيانات التوصيل والدفع
          </Heading>
          <CheckoutStatusMessage status={status} message={message} />
        </Container>
      </Section>

      <Section className="pt-2">
        <Container>
          {hasItems && settings?.is_store_open === false ? (
            <ClosedStoreState message={getEffectiveMaintenanceMessage(settings)} />
          ) : hasItems && shippingZones.length > 0 ? (
            <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start xl:gap-6">
              <CheckoutForm
                action={createCheckoutOrderAction}
                items={items}
                shippingZones={shippingZones}
                selectedShippingZoneId={selectedShippingZoneId}
                onShippingZoneChange={setSelectedShippingZoneId}
                couponCode={activeCouponState.code}
              />

              <aside className="min-w-0 space-y-4 lg:sticky lg:top-24">
                <OrderSummary
                  items={items}
                  couponState={
                    couponState.cartSignature === cartSignature ? couponState : initialCouponState
                  }
                  couponAction={couponAction}
                  shippingZones={shippingZones}
                  selectedShippingZoneId={selectedShippingZoneId}
                  settings={settings}
                  isCouponPending={isCouponPending}
                />
                <button
                  type="submit"
                  form="checkout-form"
                  disabled={!canSubmit}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-oud bg-oud-brown px-7 text-sm font-semibold text-oud-ivory shadow-soft transition hover:bg-oud-coffee disabled:cursor-not-allowed disabled:bg-oud-brown/45"
                >
                  <CheckCircle2 className="size-4" aria-hidden="true" />
                  تأكيد الطلب
                </button>
                <p className="text-center text-xs leading-6 text-oud-muted">
                  {isBelowMinimum
                    ? `الحد الأدنى للطلب هو ${minimumOrderAmount.toFixed(3)} OMR بعد الخصم.`
                    : "يتم احتساب الشحن المجاني بعد تطبيق الخصم، ولن يتم خصم المخزون حتى يؤكد فريق عود ياز الطلب."}
                </p>
              </aside>
            </div>
          ) : hasItems ? (
            <UnavailableShippingState />
          ) : (
            <EmptyCartState />
          )}
        </Container>
      </Section>
    </main>
  );
}

function getCartSignature(items: Array<{ productId: string; quantity: number }>) {
  return [...items]
    .sort((a, b) => a.productId.localeCompare(b.productId))
    .map((item) => `${item.productId}:${item.quantity}`)
    .join("|");
}

function EmptyCartState() {
  return (
    <EmptyState
      title="السلة فارغة"
      description="لا توجد منتجات في السلة حاليا. اختر منتجاتك من المتجر ثم عد لإتمام الطلب."
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

function UnavailableShippingState() {
  return (
    <EmptyState
      title="التوصيل غير متاح حاليا"
      description="لا توجد مناطق توصيل نشطة الآن. يرجى التواصل معنا عبر واتساب لإكمال الطلب."
      icon={<Truck className="size-5" aria-hidden="true" />}
      action={
        <Link
          href="/contact"
          className="inline-flex h-11 items-center justify-center rounded-oud bg-oud-brown px-6 text-sm font-semibold text-oud-ivory"
        >
          تواصل معنا
        </Link>
      }
    />
  );
}

function ClosedStoreState({ message }: { message: string }) {
  return (
    <EmptyState
      title="المتجر مغلق مؤقتا"
      description={message}
      icon={<Truck className="size-5" aria-hidden="true" />}
      action={
        <Link
          href="/contact"
          className="inline-flex h-11 items-center justify-center rounded-oud bg-oud-brown px-6 text-sm font-semibold text-oud-ivory"
        >
          تواصل معنا
        </Link>
      }
    />
  );
}

function getEffectiveMaintenanceMessage(settings: StoreSettingsRead | null) {
  return (
    settings?.maintenance_message ??
    settings?.maintenance_message_ar ??
    "المتجر مغلق مؤقتا لاستقبال الطلبات الجديدة."
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

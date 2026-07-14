"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, ShoppingBag, Truck } from "lucide-react";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { OrderSummary } from "@/components/checkout/order-summary";
import { Container, EmptyState, Heading, Section } from "@/components/ui";
import { type DeliveryMethod } from "@/constants/oman-delivery";
import {
  validateCheckoutCouponAction,
  type CouponValidationState
} from "@/features/coupons/actions";
import { createCheckoutOrderAction } from "@/features/checkout/actions";
import type { CheckoutPrefill } from "@/features/checkout/queries";
import { calculateCheckoutShippingQuote, type CheckoutShippingAddress } from "@/features/shipping/checkout-calculation";
import type { ShippingZoneRow } from "@/features/shipping/queries";
import type { StoreSettingsRead } from "@/features/store-settings/queries";
import { useCart } from "@/hooks/use-cart";

type CheckoutClientProps = {
  settings: StoreSettingsRead | null;
  prefill: CheckoutPrefill;
  shippingZones: ShippingZoneRow[];
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

export function CheckoutClient({ settings, prefill, shippingZones }: CheckoutClientProps) {
  const searchParams = useSearchParams();
  const { isHydrated, items } = useCart();
  const [selectedDeliveryMethod, setSelectedDeliveryMethod] =
    useState<DeliveryMethod>("home_delivery");
  const [shippingAddress, setShippingAddress] = useState<CheckoutShippingAddress>(() =>
    getInitialShippingAddress(prefill)
  );
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
  const shippingQuote = useMemo(
    () =>
      calculateCheckoutShippingQuote({
        deliveryMethod: selectedDeliveryMethod,
        zones: shippingZones,
        address: shippingAddress,
        subtotalAfterDiscount
      }),
    [selectedDeliveryMethod, shippingZones, shippingAddress, subtotalAfterDiscount]
  );
  const minimumOrderAmount = settings?.minimum_order_amount ?? 0;
  const isBelowMinimum = subtotalAfterDiscount < minimumOrderAmount;
  const canSubmit = !isBelowMinimum;

  return (
    <main>
      <Section className="pb-6">
        <Container className="space-y-7">
          <Heading
            level={1}
            eyebrow="إتمام الطلب"
            description="أدخل بيانات التواصل والتوصيل داخل عمان، ثم اختر طريقة الاستلام أو التوصيل والدفع المناسبة. سيتم تأكيد الطلب يدويا قبل التجهيز."
          >
            بيانات التوصيل والدفع
          </Heading>
          <CheckoutStatusMessage status={status} message={message} />
        </Container>
      </Section>

      <Section className="pt-2">
        <Container>
          {!isHydrated ? (
            <CheckoutLoadingState />
          ) : hasItems && settings?.is_store_open === false ? (
            <ClosedStoreState message={getEffectiveMaintenanceMessage(settings)} />
          ) : hasItems ? (
            <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start xl:gap-6">
              <CheckoutForm
                action={createCheckoutOrderAction}
                items={items}
                selectedDeliveryMethod={selectedDeliveryMethod}
                onDeliveryMethodChange={setSelectedDeliveryMethod}
                couponCode={activeCouponState.code}
                prefill={prefill}
                onAddressChange={setShippingAddress}
                shippingZoneId={shippingQuote.zone?.id ?? null}
                currentShippingFee={shippingQuote.shippingFee}
              />

              <aside className="min-w-0 space-y-4 lg:sticky lg:top-24">
                <OrderSummary
                  items={items}
                  couponState={
                    couponState.cartSignature === cartSignature ? couponState : initialCouponState
                  }
                  couponAction={couponAction}
                  selectedDeliveryMethod={selectedDeliveryMethod}
                  shippingFee={shippingQuote.shippingFee}
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
                    : "سيتم التحقق من الأسعار والمخزون من قاعدة البيانات، ولن يتم خصم المخزون حتى يؤكد فريق عود ياز الطلب."}
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

function getInitialShippingAddress(prefill: CheckoutPrefill): CheckoutShippingAddress {
  return {
    governorate: prefill.address?.governorate ?? prefill.customer?.governorate ?? null,
    wilayat: prefill.address?.wilayat ?? prefill.customer?.wilayat ?? null,
    area: prefill.address?.area ?? prefill.customer?.area ?? null
  };
}

function CheckoutLoadingState() {
  return (
    <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start xl:gap-6">
      <div className="space-y-5">
        {[0, 1, 2].map((item) => (
          <div key={item} className="rounded-oud border border-oud-brown/10 bg-oud-pearl p-5 shadow-soft">
            <div className="h-6 w-44 animate-pulse rounded bg-oud-beige/60" />
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="h-11 animate-pulse rounded-oud bg-oud-beige/45" />
              <div className="h-11 animate-pulse rounded-oud bg-oud-beige/45" />
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-oud border border-oud-brown/10 bg-oud-pearl p-5 shadow-soft">
        <div className="h-6 w-32 animate-pulse rounded bg-oud-beige/60" />
        <div className="mt-5 space-y-3">
          <div className="h-4 animate-pulse rounded bg-oud-beige/45" />
          <div className="h-4 animate-pulse rounded bg-oud-beige/45" />
          <div className="h-10 animate-pulse rounded bg-oud-beige/60" />
        </div>
      </div>
    </div>
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

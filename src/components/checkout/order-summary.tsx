import Image from "next/image";
import { PackageCheck, TicketPercent, XCircle } from "lucide-react";
import { Button, Card, Input, Price } from "@/components/ui";
import { getDeliveryMethod, type DeliveryMethod } from "@/constants/oman-delivery";
import type { CouponValidationState } from "@/features/coupons/actions";
import type { StoreSettingsRead } from "@/features/store-settings/queries";
import type { CartItem } from "@/stores/cart-store";

type OrderSummaryProps = {
  items: CartItem[];
  couponState: CouponValidationState;
  couponAction: (formData: FormData) => void;
  selectedDeliveryMethod: DeliveryMethod;
  shippingFee: number;
  settings: StoreSettingsRead | null;
  isCouponPending?: boolean;
};

export function OrderSummary({
  items,
  couponState,
  couponAction,
  selectedDeliveryMethod,
  shippingFee,
  settings,
  isCouponPending = false
}: OrderSummaryProps) {
  const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);
  const discount = couponState.status === "success" ? couponState.discountAmount : 0;
  const subtotalAfterDiscount = Math.max(0, subtotal - discount);
  const selectedMethod = getDeliveryMethod(selectedDeliveryMethod);
  const tax = settings?.is_tax_enabled
    ? Number((subtotalAfterDiscount * (settings.tax_rate / 100)).toFixed(3))
    : 0;
  const total = subtotalAfterDiscount + shippingFee + tax;

  return (
    <Card className="p-4 sm:p-5">
      <h2 className="font-display text-xl font-bold text-oud-brown sm:text-2xl">مراجعة الطلب</h2>
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
              <p className="break-words text-sm font-bold text-oud-brown">{item.name}</p>
              <p className="mt-1 text-xs text-oud-muted">
                الكمية: {item.quantity} · {item.sizeLabel}
              </p>
            </div>
            <Price value={item.price * item.quantity} className="shrink-0 text-sm" />
          </div>
        ))}
      </div>

      <CouponBox
        items={items}
        state={couponState}
        action={couponAction}
        isPending={isCouponPending}
      />

      <div className="mt-5 space-y-3 border-t border-oud-brown/10 pt-5 text-sm">
        <SummaryRow label="المجموع الفرعي" value={<Price value={subtotal} />} />
        {discount > 0 ? (
          <SummaryRow
            label={`خصم الكوبون ${couponState.code ?? ""}`}
            value={<Price value={-discount} className="text-green-900" />}
          />
        ) : null}
        <SummaryRow
          label={selectedMethod ? selectedMethod.label : "التوصيل"}
          value={<Price value={shippingFee} />}
        />
        {settings?.is_tax_enabled ? (
          <SummaryRow label={`الضريبة ${settings.tax_rate}%`} value={<Price value={tax} />} />
        ) : null}
        {(settings?.minimum_order_amount ?? 0) > 0 ? (
          <SummaryRow
            label="الحد الأدنى للطلب"
            value={<Price value={settings?.minimum_order_amount ?? 0} />}
          />
        ) : null}
        <SummaryRow label="الإجمالي" value={<Price value={total} className="text-lg" />} />
      </div>

      <div className="mt-5 flex gap-2 rounded-oud bg-oud-beige/35 p-3 text-xs leading-6 text-oud-muted">
        <PackageCheck className="mt-0.5 size-4 shrink-0 text-oud-gold" aria-hidden="true" />
        سيتم تأكيد الطلب والدفع يدويا بعد مراجعة المنتجات والمخزون.
      </div>
    </Card>
  );
}

function CouponBox({
  items,
  state,
  action,
  isPending
}: {
  items: CartItem[];
  state: CouponValidationState;
  action: (formData: FormData) => void;
  isPending: boolean;
}) {
  return (
    <div className="mt-5 rounded-oud border border-oud-brown/10 bg-oud-beige/25 p-4">
      <form action={action} className="space-y-3">
        <input type="hidden" name="intent" value="apply" />
        {items.map((item) => (
          <div key={item.productId}>
            <input type="hidden" name="productId" value={item.productId} />
            <input type="hidden" name="quantity" value={item.quantity} />
          </div>
        ))}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <Input
            label="كوبون الخصم"
            name="couponCode"
            defaultValue={state.code ?? ""}
            placeholder="OUD10"
            dir="ltr"
            className="bg-white"
          />
          <Button type="submit" variant="gold" isLoading={isPending} className="sm:w-auto">
            تطبيق
          </Button>
        </div>
      </form>

      {state.message ? (
        <div
          className={
            state.status === "success"
              ? "mt-3 flex items-start gap-2 rounded-oud bg-green-900/10 px-3 py-2 text-xs font-semibold text-green-900"
              : "mt-3 flex items-start gap-2 rounded-oud bg-red-900/10 px-3 py-2 text-xs font-semibold text-red-900"
          }
        >
          {state.status === "success" ? (
            <TicketPercent className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          ) : (
            <XCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          )}
          <span>{state.message}</span>
        </div>
      ) : null}

      {state.status === "success" ? (
        <form action={action} className="mt-3">
          <input type="hidden" name="intent" value="remove" />
          {items.map((item) => (
            <div key={item.productId}>
              <input type="hidden" name="productId" value={item.productId} />
              <input type="hidden" name="quantity" value={item.quantity} />
            </div>
          ))}
          <Button type="submit" variant="ghost" size="sm">
            إزالة الكوبون
          </Button>
        </form>
      ) : null}
    </div>
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

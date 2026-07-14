"use client";

import { useMemo, useState } from "react";
import { Building2, Home } from "lucide-react";
import { Input, Price, Select, Textarea } from "@/components/ui";
import {
  DELIVERY_METHODS,
  OMAN_GOVERNORATES,
  getGovernorateWilayats,
  type DeliveryMethod
} from "@/constants/oman-delivery";
import { cn } from "@/utils/cn";
import { PaymentMethodSelector } from "./payment-method-selector";
import type { CheckoutPrefill } from "@/features/checkout/queries";
import type { CartItem } from "@/stores/cart-store";

type CheckoutFormProps = {
  action: (formData: FormData) => Promise<void>;
  items: CartItem[];
  selectedDeliveryMethod: DeliveryMethod;
  onDeliveryMethodChange: (method: DeliveryMethod) => void;
  couponCode?: string | null;
  prefill: CheckoutPrefill;
};

const defaultGovernorate = OMAN_GOVERNORATES[0]?.name ?? "مسقط";

export function CheckoutForm({
  action,
  items,
  selectedDeliveryMethod,
  onDeliveryMethodChange,
  couponCode,
  prefill
}: CheckoutFormProps) {
  const customer = prefill.customer;
  const savedAddress = prefill.address;
  const initialFullName = customer?.full_name ?? savedAddress?.full_name ?? "";
  const initialPhone = customer?.phone ?? savedAddress?.phone ?? "";
  const initialWhatsapp = customer?.whatsapp_number ?? "";
  const initialEmail = customer?.email ?? "";
  const initialGovernorate = savedAddress?.governorate || customer?.governorate || defaultGovernorate;
  const initialWilayats = getGovernorateWilayats(initialGovernorate);
  const initialWilayat =
    savedAddress?.wilayat && initialWilayats.includes(savedAddress.wilayat)
      ? savedAddress.wilayat
      : customer?.wilayat && initialWilayats.includes(customer.wilayat)
        ? customer.wilayat
        : (initialWilayats[0] ?? "");
  const initialArea = savedAddress?.area ?? customer?.area ?? "";
  const initialAddressLine = savedAddress?.address_line_1 ?? customer?.detailed_address ?? "";
  const initialDeliveryNotes = savedAddress?.delivery_notes ?? "";
  const [governorate, setGovernorate] = useState<string>(initialGovernorate);
  const wilayats = useMemo(() => getGovernorateWilayats(governorate), [governorate]);
  const [wilayat, setWilayat] = useState<string>(initialWilayat);
  const [area, setArea] = useState(initialArea);
  const [addressLine, setAddressLine] = useState(initialAddressLine);
  const [deliveryNotes, setDeliveryNotes] = useState(initialDeliveryNotes);
  const initialAddressSnapshot = useMemo(
    () =>
      normalizeAddressSnapshot({
        governorate: initialGovernorate,
        wilayat: initialWilayat,
        area: initialArea,
        addressLine: initialAddressLine,
        deliveryNotes: initialDeliveryNotes
      }),
    [initialAddressLine, initialArea, initialDeliveryNotes, initialGovernorate, initialWilayat]
  );
  const currentAddressSnapshot = normalizeAddressSnapshot({
    governorate,
    wilayat,
    area,
    addressLine,
    deliveryNotes
  });
  const addressChanged = currentAddressSnapshot !== initialAddressSnapshot;
  const hasEnteredNewAddress = Boolean(area.trim() || addressLine.trim() || deliveryNotes.trim());
  const showSaveAddressOption = Boolean(customer?.id && addressChanged && (prefill.hasSavedAddress || hasEnteredNewAddress));

  function handleGovernorateChange(value: string) {
    const nextWilayats = getGovernorateWilayats(value);

    setGovernorate(value);
    setWilayat(nextWilayats[0] ?? "");
  }

  return (
    <form id="checkout-form" action={action} className="min-w-0 space-y-5" aria-label="نموذج إتمام الطلب">
      {couponCode ? <input type="hidden" name="couponCode" value={couponCode} /> : null}
      {items.map((item) => (
        <div key={item.productId}>
          <input type="hidden" name="productId" value={item.productId} />
          <input type="hidden" name="quantity" value={item.quantity} />
        </div>
      ))}

      <section className="min-w-0 rounded-oud border border-oud-brown/10 bg-oud-pearl p-4 shadow-soft sm:p-5">
        <h2 className="font-display text-xl font-bold text-oud-brown sm:text-2xl">بيانات العميل</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Input
            label="الاسم الكامل"
            name="fullName"
            placeholder="مثال: أحمد الهاشمي"
            defaultValue={initialFullName}
            required
          />
          <Input
            label="رقم الهاتف"
            name="phone"
            type="tel"
            placeholder="9XXXXXXX"
            defaultValue={initialPhone}
            required
          />
          <Input
            label="واتساب اختياري"
            name="whatsapp"
            type="tel"
            placeholder="إن كان مختلفا عن الهاتف"
            defaultValue={initialWhatsapp}
          />
          <Input
            label="البريد الإلكتروني اختياري"
            name="email"
            type="email"
            placeholder="name@example.com"
            defaultValue={initialEmail}
            dir="ltr"
          />
        </div>
      </section>

      <section className="min-w-0 rounded-oud border border-oud-brown/10 bg-oud-pearl p-4 shadow-soft sm:p-5">
        <h2 className="font-display text-xl font-bold text-oud-brown sm:text-2xl">عنوان التوصيل داخل عمان</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <input type="hidden" name="country" value="Oman" />
          <Select
            label="المحافظة"
            name="governorate"
            value={governorate}
            onChange={(event) => handleGovernorateChange(event.target.value)}
            required
          >
            {OMAN_GOVERNORATES.map((item) => (
              <option key={item.name} value={item.name}>
                {item.name}
              </option>
            ))}
          </Select>
          <Select
            label="الولاية"
            name="wilayat"
            value={wilayat}
            onChange={(event) => setWilayat(event.target.value)}
            required
          >
            {wilayats.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
          <Input
            label="المنطقة"
            name="area"
            placeholder="مثال: الخوير"
            value={area}
            onChange={(event) => setArea(event.target.value)}
            required
          />
          <Input
            label="العنوان التفصيلي"
            name="addressLine"
            placeholder="رقم المبنى، الشارع، أقرب معلم"
            value={addressLine}
            onChange={(event) => setAddressLine(event.target.value)}
            required
          />
          <Textarea
            label="ملاحظات التوصيل"
            name="deliveryNotes"
            placeholder="وقت مناسب للتواصل أو تفاصيل إضافية"
            value={deliveryNotes}
            onChange={(event) => setDeliveryNotes(event.target.value)}
            className="md:col-span-2"
          />
          {showSaveAddressOption ? (
            <label className="flex items-start gap-2 rounded-oud border border-oud-brown/10 bg-oud-beige/20 px-3 py-3 text-sm leading-6 text-oud-brown md:col-span-2">
              <input
                name="saveAddressToAccount"
                type="checkbox"
                value="1"
                className="mt-1 size-4 accent-oud-brown"
              />
              حفظ هذا العنوان في حسابي
            </label>
          ) : null}
        </div>
      </section>

      <section className="min-w-0 rounded-oud border border-oud-brown/10 bg-oud-pearl p-4 shadow-soft sm:p-5">
        <h2 className="font-display text-xl font-bold text-oud-brown sm:text-2xl">طريقة الاستلام والتوصيل</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {DELIVERY_METHODS.map((method) => {
            const isSelected = selectedDeliveryMethod === method.id;
            const Icon = method.id === "pickup_office" ? Building2 : Home;

            return (
              <label
                key={method.id}
                className={cn(
                  "flex cursor-pointer gap-3 rounded-oud border bg-white p-4 transition",
                  "hover:border-oud-gold/45 hover:bg-oud-beige/20",
                  isSelected
                    ? "border-oud-gold bg-oud-beige/35 ring-2 ring-oud-gold/20"
                    : "border-oud-brown/10"
                )}
              >
                <input
                  type="radio"
                  name="deliveryMethod"
                  value={method.id}
                  checked={isSelected}
                  onChange={() => onDeliveryMethodChange(method.id)}
                  className="mt-1 size-4 accent-oud-brown"
                  required
                />
                <span className="grid size-10 shrink-0 place-items-center rounded-oud bg-oud-beige/45 text-oud-brown">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-oud-brown">{method.label}</span>
                  <span className="mt-1 block text-xs leading-6 text-oud-muted">
                    {method.description}
                  </span>
                  <span className="mt-2 block">
                    <Price value={method.fee} className="text-sm" />
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </section>

      <PaymentMethodSelector />
    </form>
  );
}

function normalizeAddressSnapshot({
  governorate,
  wilayat,
  area,
  addressLine,
  deliveryNotes
}: {
  governorate: string;
  wilayat: string;
  area: string;
  addressLine: string;
  deliveryNotes: string;
}) {
  return [governorate, wilayat, area, addressLine, deliveryNotes]
    .map((value) => value.trim().replace(/\s+/g, " "))
    .join("|");
}

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
import type { CustomerProfile } from "@/features/auth/queries";
import type { CartItem } from "@/stores/cart-store";

type CheckoutFormProps = {
  action: (formData: FormData) => Promise<void>;
  items: CartItem[];
  selectedDeliveryMethod: DeliveryMethod;
  onDeliveryMethodChange: (method: DeliveryMethod) => void;
  couponCode?: string | null;
  customer?: CustomerProfile | null;
};

const defaultGovernorate = OMAN_GOVERNORATES[0]?.name ?? "مسقط";

export function CheckoutForm({
  action,
  items,
  selectedDeliveryMethod,
  onDeliveryMethodChange,
  couponCode,
  customer
}: CheckoutFormProps) {
  const initialGovernorate = customer?.governorate || defaultGovernorate;
  const [governorate, setGovernorate] = useState<string>(initialGovernorate);
  const wilayats = useMemo(() => getGovernorateWilayats(governorate), [governorate]);
  const [wilayat, setWilayat] = useState<string>(
    customer?.wilayat && wilayats.includes(customer.wilayat)
      ? customer.wilayat
      : (wilayats[0] ?? "")
  );

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
            defaultValue={customer?.full_name ?? ""}
            required
          />
          <Input
            label="رقم الهاتف"
            name="phone"
            type="tel"
            placeholder="9XXXXXXX"
            defaultValue={customer?.phone ?? ""}
            required
          />
          <Input
            label="واتساب اختياري"
            name="whatsapp"
            type="tel"
            placeholder="إن كان مختلفا عن الهاتف"
          />
          <Input
            label="البريد الإلكتروني اختياري"
            name="email"
            type="email"
            placeholder="name@example.com"
            defaultValue={customer?.email ?? ""}
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
            defaultValue={customer?.area ?? ""}
            required
          />
          <Input
            label="العنوان التفصيلي"
            name="addressLine"
            placeholder="رقم المبنى، الشارع، أقرب معلم"
            defaultValue={customer?.detailed_address ?? ""}
            required
          />
          <Textarea
            label="ملاحظات التوصيل"
            name="deliveryNotes"
            placeholder="وقت مناسب للتواصل أو تفاصيل إضافية"
            className="md:col-span-2"
          />
          {customer?.id ? (
            <label className="flex items-start gap-2 rounded-oud border border-oud-brown/10 bg-oud-beige/20 px-3 py-3 text-sm leading-6 text-oud-brown md:col-span-2">
              <input
                name="saveDeliveryProfile"
                type="checkbox"
                value="1"
                className="mt-1 size-4 accent-oud-brown"
              />
              حفظ هذه البيانات كعنوان التوصيل الافتراضي في حسابي
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

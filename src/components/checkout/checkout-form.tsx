import { Input, Select, Textarea } from "@/components/ui";
import { PaymentMethodSelector } from "./payment-method-selector";
import type { CartItem } from "@/stores/cart-store";

type CheckoutFormProps = {
  action: (formData: FormData) => Promise<void>;
  items: CartItem[];
};

export function CheckoutForm({ action, items }: CheckoutFormProps) {
  return (
    <form id="checkout-form" action={action} className="space-y-5" aria-label="نموذج إتمام الطلب">
      {items.map((item) => (
        <div key={item.productId}>
          <input type="hidden" name="productId" value={item.productId} />
          <input type="hidden" name="quantity" value={item.quantity} />
        </div>
      ))}

      <section className="rounded-oud border border-oud-brown/10 bg-oud-pearl p-5 shadow-soft">
        <h2 className="font-display text-2xl font-bold text-oud-brown">بيانات العميل</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Input
            label="الاسم الكامل"
            name="fullName"
            placeholder="مثال: أحمد الهاشمي"
            required
          />
          <Input label="رقم الهاتف" name="phone" type="tel" placeholder="9XXXXXXX" required />
          <Input
            label="واتساب اختياري"
            name="whatsapp"
            type="tel"
            placeholder="إن كان مختلفاً عن الهاتف"
          />
          <Input
            label="البريد الإلكتروني اختياري"
            name="email"
            type="email"
            placeholder="name@example.com"
            dir="ltr"
          />
        </div>
      </section>

      <section className="rounded-oud border border-oud-brown/10 bg-oud-pearl p-5 shadow-soft">
        <h2 className="font-display text-2xl font-bold text-oud-brown">عنوان التوصيل</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Select label="الدولة" name="country" defaultValue="Oman" required>
            <option value="Oman">عمان</option>
            <option value="UAE">الإمارات</option>
            <option value="Saudi Arabia">السعودية</option>
          </Select>
          <Select label="المحافظة" name="governorate" defaultValue="مسقط" required>
            <option value="مسقط">مسقط</option>
            <option value="ظفار">ظفار</option>
            <option value="الداخلية">الداخلية</option>
            <option value="شمال الباطنة">شمال الباطنة</option>
            <option value="جنوب الباطنة">جنوب الباطنة</option>
          </Select>
          <Select label="الولاية" name="wilayat" defaultValue="بوشر" required>
            <option value="بوشر">بوشر</option>
            <option value="مطرح">مطرح</option>
            <option value="السيب">السيب</option>
            <option value="نزوى">نزوى</option>
            <option value="صلالة">صلالة</option>
          </Select>
          <Input label="المنطقة" name="area" placeholder="مثال: الخوير" />
          <Input
            label="العنوان التفصيلي"
            name="addressLine"
            placeholder="رقم المبنى، الشارع، أقرب معلم"
            className="md:col-span-2"
            required
          />
          <Textarea
            label="ملاحظات التوصيل"
            name="deliveryNotes"
            placeholder="وقت مناسب للتواصل أو تفاصيل إضافية"
            className="md:col-span-2"
          />
        </div>
      </section>

      <PaymentMethodSelector />
    </form>
  );
}

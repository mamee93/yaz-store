import { Card, Input, Select, Textarea } from "@/components/ui";

export function SettingsForm() {
  return (
    <form className="grid gap-5 xl:grid-cols-2" aria-label="إعدادات المتجر">
      <Card className="p-5 shadow-none">
        <h2 className="font-display text-2xl font-bold text-oud-brown">هوية المتجر</h2>
        <div className="mt-5 space-y-4">
          <Input label="اسم المتجر بالعربية" name="storeNameAr" defaultValue="عود ياز" />
          <Input label="اسم المتجر بالإنجليزية" name="storeNameEn" defaultValue="Oud Yaz" dir="ltr" />
          <Textarea label="قصة العلامة" name="brandStory" />
          <Select label="حالة المتجر" name="storeStatus" defaultValue="open">
            <option value="open">مفتوح</option>
            <option value="maintenance">صيانة</option>
          </Select>
        </div>
      </Card>

      <Card className="p-5 shadow-none">
        <h2 className="font-display text-2xl font-bold text-oud-brown">التواصل والشبكات</h2>
        <div className="mt-5 space-y-4">
          <Input label="رقم واتساب" name="whatsapp" dir="ltr" />
          <Input label="الهاتف" name="phone" dir="ltr" />
          <Input label="البريد" name="email" type="email" dir="ltr" />
          <Input label="إنستغرام" name="instagram" dir="ltr" />
          <Input label="تيك توك" name="tiktok" dir="ltr" />
        </div>
      </Card>

      <Card className="p-5 shadow-none">
        <h2 className="font-display text-2xl font-bold text-oud-brown">التوصيل والسياسات</h2>
        <div className="mt-5 space-y-4">
          <Input label="رسوم التوصيل OMR" name="deliveryFee" type="number" defaultValue="2.000" />
          <Input label="حد التوصيل المجاني OMR" name="freeDelivery" type="number" />
          <Textarea label="سياسة التوصيل" name="deliveryPolicy" />
          <Textarea label="سياسة الاسترجاع" name="returnsPolicy" />
        </div>
      </Card>

      <Card className="p-5 shadow-none">
        <h2 className="font-display text-2xl font-bold text-oud-brown">SEO افتراضي</h2>
        <div className="mt-5 space-y-4">
          <Input label="عنوان SEO" name="metaTitle" />
          <Textarea label="وصف SEO" name="metaDescription" />
          <Textarea label="الشروط والأحكام" name="terms" />
          <div className="rounded-oud bg-oud-brown px-5 py-3 text-center text-sm font-semibold text-oud-ivory">
            حفظ الإعدادات تجريبياً
          </div>
        </div>
      </Card>
    </form>
  );
}

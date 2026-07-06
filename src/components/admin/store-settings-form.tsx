import { Save } from "lucide-react";
import { Button, Card, Input, Textarea } from "@/components/ui";
import { updateStoreSettingsAction } from "@/features/store-settings/actions";
import type { StoreSettingsRead } from "@/features/store-settings/queries";

type StoreSettingsFormProps = {
  settings: StoreSettingsRead | null;
};

export function StoreSettingsForm({ settings }: StoreSettingsFormProps) {
  return (
    <form action={updateStoreSettingsAction} className="grid gap-5 xl:grid-cols-2" aria-label="إعدادات المتجر">
      <Card className="p-5 shadow-none">
        <h2 className="font-display text-2xl font-bold text-oud-brown">هوية المتجر</h2>
        <div className="mt-5 space-y-4">
          <Input
            label="اسم المتجر"
            name="store_name"
            defaultValue={settings?.store_name ?? settings?.store_name_ar ?? "عود ياز"}
            required
          />
          <Textarea
            label="وصف المتجر"
            name="store_description"
            defaultValue={settings?.store_description ?? settings?.brand_story_ar ?? ""}
          />
          <Input label="رابط الشعار" name="logo_url" defaultValue={settings?.logo_url ?? ""} dir="ltr" />
          <Input label="رابط الأيقونة" name="favicon_url" defaultValue={settings?.favicon_url ?? ""} dir="ltr" />
        </div>
      </Card>

      <Card className="p-5 shadow-none">
        <h2 className="font-display text-2xl font-bold text-oud-brown">التواصل والشبكات</h2>
        <div className="mt-5 space-y-4">
          <Input
            label="البريد الإلكتروني"
            name="store_email"
            type="email"
            defaultValue={settings?.store_email ?? settings?.support_email ?? ""}
            dir="ltr"
          />
          <Input
            label="الهاتف"
            name="store_phone"
            defaultValue={settings?.store_phone ?? settings?.contact_phone ?? ""}
            dir="ltr"
          />
          <Input
            label="واتساب"
            name="whatsapp_number"
            defaultValue={settings?.whatsapp_number ?? ""}
            dir="ltr"
          />
          <Input label="إنستغرام" name="instagram_url" defaultValue={settings?.instagram_url ?? ""} dir="ltr" />
          <Input label="تيك توك" name="tiktok_url" defaultValue={settings?.tiktok_url ?? ""} dir="ltr" />
        </div>
      </Card>

      <Card className="p-5 shadow-none">
        <h2 className="font-display text-2xl font-bold text-oud-brown">الطلبات والعملة</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Input
            label="رمز العملة"
            name="currency_code"
            defaultValue={settings?.currency_code ?? "OMR"}
            dir="ltr"
            required
          />
          <Input
            label="رمز العرض"
            name="currency_symbol"
            defaultValue={settings?.currency_symbol ?? "ر.ع"}
            required
          />
          <Input
            label="بادئة رقم الطلب"
            name="order_prefix"
            defaultValue={settings?.order_prefix ?? "ORD"}
            dir="ltr"
            required
          />
          <Input
            label="الحد الأدنى للطلب"
            name="minimum_order_amount"
            type="number"
            min="0"
            step="0.001"
            defaultValue={settings?.minimum_order_amount ?? 0}
          />
        </div>
      </Card>

      <Card className="p-5 shadow-none">
        <h2 className="font-display text-2xl font-bold text-oud-brown">حالة المتجر والضريبة</h2>
        <div className="mt-5 space-y-4">
          <CheckboxField
            name="is_store_open"
            label="المتجر مفتوح للطلبات"
            defaultChecked={settings?.is_store_open ?? true}
          />
          <Textarea
            label="رسالة الصيانة"
            name="maintenance_message"
            defaultValue={settings?.maintenance_message ?? settings?.maintenance_message_ar ?? ""}
          />
          <CheckboxField
            name="is_tax_enabled"
            label="تفعيل الضريبة"
            defaultChecked={settings?.is_tax_enabled ?? false}
          />
          <Input
            label="نسبة الضريبة %"
            name="tax_rate"
            type="number"
            min="0"
            max="100"
            step="0.01"
            defaultValue={settings?.tax_rate ?? 0}
          />
          <Button type="submit" className="w-full" leftIcon={<Save className="size-4" />}>
            حفظ الإعدادات
          </Button>
        </div>
      </Card>
    </form>
  );
}

function CheckboxField({
  name,
  label,
  defaultChecked
}: {
  name: string;
  label: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-oud border border-oud-brown/10 bg-oud-pearl px-3 py-3 text-sm font-semibold text-oud-brown">
      <span>{label}</span>
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="size-4 accent-oud-gold"
      />
    </label>
  );
}

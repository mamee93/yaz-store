import { Save } from "lucide-react";
import { Button, Card, Input, Textarea } from "@/components/ui";
import { updateStoreSettingsAction } from "@/features/store-settings/actions";
import type { StoreSettingsRead } from "@/features/store-settings/queries";

type StoreSettingsFormProps = {
  settings: StoreSettingsRead | null;
};

export function StoreSettingsForm({ settings }: StoreSettingsFormProps) {
  return (
    <form
      action={updateStoreSettingsAction}
      className="grid gap-5 xl:grid-cols-2"
      aria-label="إعدادات المتجر"
    >
      <Card className="p-4 shadow-none sm:p-5">
        <h2 className="font-display text-xl font-bold text-oud-brown sm:text-2xl">هوية المتجر</h2>
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
          <AssetUploadField
            title="شعار المتجر"
            currentUrl={settings?.logo_url ?? null}
            fileName="logo_file"
            urlName="logo_url"
            removeName="remove_logo"
            maxSizeLabel="2MB"
          />
          <AssetUploadField
            title="أيقونة المتجر"
            currentUrl={settings?.favicon_url ?? null}
            fileName="favicon_file"
            urlName="favicon_url"
            removeName="remove_favicon"
            maxSizeLabel="512KB"
          />
        </div>
      </Card>

      <Card className="p-4 shadow-none sm:p-5">
        <h2 className="font-display text-xl font-bold text-oud-brown sm:text-2xl">التواصل والشبكات</h2>
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

      <Card className="p-4 shadow-none sm:p-5">
        <h2 className="font-display text-xl font-bold text-oud-brown sm:text-2xl">الطلبات والعملة</h2>
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

      <Card className="p-4 shadow-none sm:p-5">
        <h2 className="font-display text-xl font-bold text-oud-brown sm:text-2xl">حالة المتجر والضريبة</h2>
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

function AssetUploadField({
  title,
  currentUrl,
  fileName,
  urlName,
  removeName,
  maxSizeLabel
}: {
  title: string;
  currentUrl: string | null;
  fileName: string;
  urlName: string;
  removeName: string;
  maxSizeLabel: string;
}) {
  return (
    <div className="rounded-oud border border-oud-brown/10 bg-oud-beige/25 p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-oud border border-oud-brown/10 bg-white">
          {currentUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={currentUrl} alt={title} className="h-full w-full object-contain p-2" />
          ) : (
            <span className="text-xs font-semibold text-oud-muted">لا توجد صورة</span>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="text-sm font-semibold text-oud-brown">{title}</p>
            <p className="mt-1 text-xs leading-5 text-oud-muted">
              PNG أو JPG أو WEBP أو SVG. الحد الأقصى {maxSizeLabel}.
            </p>
          </div>
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-oud-brown">رفع من الجهاز</span>
            <input
              type="file"
              name={fileName}
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="block w-full rounded-oud border border-oud-brown/15 bg-white px-3 py-2 text-sm text-oud-ink file:me-3 file:rounded-md file:border-0 file:bg-oud-brown file:px-3 file:py-2 file:text-xs file:font-semibold file:text-oud-ivory"
            />
          </label>
          <Input
            label="رابط يدوي اختياري"
            name={urlName}
            defaultValue={currentUrl ?? ""}
            dir="ltr"
            placeholder="https://..."
          />
          {currentUrl ? (
            <label className="inline-flex items-center gap-2 rounded-full border border-red-900/15 bg-red-900/10 px-4 py-2 text-xs font-semibold text-red-900">
              <input type="checkbox" name={removeName} className="size-4 accent-red-900" />
              إزالة الصورة الحالية
            </label>
          ) : null}
        </div>
      </div>
    </div>
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

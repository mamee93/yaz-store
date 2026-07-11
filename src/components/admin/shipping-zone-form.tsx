import Link from "next/link";
import { Save } from "lucide-react";
import { Button, Card, Input } from "@/components/ui";
import type { ShippingZoneRow } from "@/features/shipping/queries";

type ShippingZoneFormProps = {
  mode: "new" | "edit";
  zone?: ShippingZoneRow | null;
  action: (formData: FormData) => Promise<void>;
};

export function ShippingZoneForm({ mode, zone, action }: ShippingZoneFormProps) {
  const isEdit = mode === "edit";

  return (
    <form action={action} className="grid gap-5 xl:grid-cols-[1fr_22rem]" aria-label="نموذج منطقة التوصيل">
      <div className="space-y-5">
        <Card className="p-5 shadow-none">
          <h2 className="font-display text-2xl font-bold text-oud-brown">بيانات المنطقة</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Input
              label="اسم المنطقة"
              name="name"
              defaultValue={zone?.name ?? ""}
              placeholder="مسقط - الخوير"
              required
            />
            <Input
              label="المدينة"
              name="city"
              defaultValue={zone?.city ?? ""}
              placeholder="مسقط"
              required
            />
            <Input
              label="المنطقة / الولاية"
              name="area"
              defaultValue={zone?.area ?? ""}
              placeholder="الخوير"
              required
            />
            <Input
              label="مدة التوصيل المتوقعة"
              name="estimated_delivery_time"
              defaultValue={zone?.estimated_delivery_time ?? ""}
              placeholder="1-2 يوم عمل"
            />
          </div>
        </Card>

        <Card className="p-5 shadow-none">
          <h2 className="font-display text-2xl font-bold text-oud-brown">الرسوم والقواعد</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Input
              label="رسوم التوصيل OMR"
              name="delivery_fee_omr"
              type="number"
              min="0"
              step="0.001"
              defaultValue={zone?.delivery_fee_omr ?? 0}
              required
            />
            <Input
              label="حد الشحن المجاني"
              name="free_shipping_minimum_omr"
              type="number"
              min="0"
              step="0.001"
              defaultValue={zone?.free_shipping_minimum_omr ?? ""}
              hint="يطبق بعد الخصم. اتركه فارغا لتعطيل الشحن المجاني."
            />
            <Input
              label="ترتيب الظهور"
              name="sort_order"
              type="number"
              min="0"
              defaultValue={zone?.sort_order ?? 0}
            />
          </div>
        </Card>
      </div>

      <aside className="space-y-5">
        <Card className="p-5 shadow-none">
          <h2 className="font-display text-2xl font-bold text-oud-brown">الحالة</h2>
          <div className="mt-5">
            <CheckboxField
              name="is_active"
              label="منطقة نشطة"
              defaultChecked={zone?.is_active ?? true}
            />
          </div>
        </Card>

        <Card className="space-y-3 p-5 shadow-none">
          <Button type="submit" className="w-full" leftIcon={<Save className="size-4" />}>
            {isEdit ? "حفظ التعديلات" : "إنشاء المنطقة"}
          </Button>
          <Link
            href="/admin/shipping"
            className="inline-flex h-11 w-full items-center justify-center rounded-oud border border-oud-brown/15 bg-white text-sm font-semibold text-oud-brown transition hover:bg-oud-beige/35"
          >
            العودة للتوصيل
          </Link>
        </Card>
      </aside>
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

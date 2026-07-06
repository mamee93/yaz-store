import Link from "next/link";
import { Save, Trash2 } from "lucide-react";
import { Button, Card, Input, Select, Textarea } from "@/components/ui";
import { deactivateCouponAction } from "@/features/coupons/actions";
import type { CouponRow } from "@/features/coupons/queries";

type CouponFormProps = {
  mode: "new" | "edit";
  coupon?: CouponRow | null;
  action: (formData: FormData) => Promise<void>;
};

export function CouponForm({ mode, coupon, action }: CouponFormProps) {
  const isEdit = mode === "edit";
  const deleteAction = coupon ? deactivateCouponAction.bind(null, coupon.id) : undefined;

  return (
    <form action={action} className="grid gap-5 xl:grid-cols-[1fr_22rem]" aria-label="نموذج الكوبون">
      <div className="space-y-5">
        <Card className="p-5 shadow-none">
          <h2 className="font-display text-2xl font-bold text-oud-brown">بيانات الكوبون</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Input
              label="كود الخصم"
              name="code"
              defaultValue={coupon?.code ?? ""}
              dir="ltr"
              placeholder="OUD10"
              required
            />
            <Input
              label="اسم الكوبون"
              name="name"
              defaultValue={coupon?.name ?? ""}
              placeholder="خصم افتتاح المتجر"
              required
            />
            <Textarea
              label="الوصف"
              name="description"
              defaultValue={coupon?.description ?? ""}
              className="md:col-span-2"
            />
          </div>
        </Card>

        <Card className="p-5 shadow-none">
          <h2 className="font-display text-2xl font-bold text-oud-brown">قواعد الخصم</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Select
              label="نوع الخصم"
              name="discount_type"
              defaultValue={coupon?.discount_type ?? "percentage"}
              required
            >
              <option value="percentage">نسبة مئوية</option>
              <option value="fixed">مبلغ ثابت</option>
            </Select>
            <Input
              label="قيمة الخصم"
              name="discount_value"
              type="number"
              min="0.001"
              step="0.001"
              defaultValue={coupon?.discount_value ?? ""}
              required
            />
            <Input
              label="الحد الأدنى للطلب"
              name="minimum_order_amount"
              type="number"
              min="0"
              step="0.001"
              defaultValue={coupon?.minimum_order_amount ?? 0}
            />
            <Input
              label="أقصى خصم اختياري"
              name="maximum_discount_amount"
              type="number"
              min="0.001"
              step="0.001"
              defaultValue={coupon?.maximum_discount_amount ?? ""}
            />
          </div>
        </Card>

        <Card className="p-5 shadow-none">
          <h2 className="font-display text-2xl font-bold text-oud-brown">الاستخدام والمدة</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Input
              label="حد الاستخدام"
              name="usage_limit"
              type="number"
              min="1"
              defaultValue={coupon?.usage_limit ?? ""}
            />
            <Input
              label="عدد الاستخدام الحالي"
              value={coupon?.used_count ?? 0}
              disabled
            />
            <Input
              label="يبدأ في"
              name="starts_at"
              type="datetime-local"
              defaultValue={formatDateTimeLocal(coupon?.starts_at)}
            />
            <Input
              label="ينتهي في"
              name="expires_at"
              type="datetime-local"
              defaultValue={formatDateTimeLocal(coupon?.expires_at)}
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
              label="كوبون نشط"
              defaultChecked={coupon?.is_active ?? true}
            />
          </div>
        </Card>

        <Card className="space-y-3 p-5 shadow-none">
          <Button type="submit" className="w-full" leftIcon={<Save className="size-4" />}>
            {isEdit ? "حفظ التعديلات" : "إنشاء الكوبون"}
          </Button>
          <Link
            href="/admin/coupons"
            className="inline-flex h-11 w-full items-center justify-center rounded-oud border border-oud-brown/15 bg-white text-sm font-semibold text-oud-brown transition hover:bg-oud-beige/35"
          >
            العودة للكوبونات
          </Link>
          {deleteAction ? (
            <Button
              type="submit"
              formAction={deleteAction}
              formNoValidate
              variant="danger"
              className="w-full"
              leftIcon={<Trash2 className="size-4" />}
            >
              حذف آمن / إيقاف
            </Button>
          ) : null}
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

function formatDateTimeLocal(value?: string | null) {
  if (!value) {
    return "";
  }

  return new Date(value).toISOString().slice(0, 16);
}

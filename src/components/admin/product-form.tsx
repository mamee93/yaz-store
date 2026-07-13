import Link from "next/link";
import { Save } from "lucide-react";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { Button, Card, Input, Select, Textarea } from "@/components/ui";
import type { CategoryAdminRead } from "@/features/categories/queries";
import type { ProductRow } from "@/features/products/queries";

type ProductFormProps = {
  mode: "new" | "edit";
  categories: CategoryAdminRead[];
  product?: ProductRow | null;
  action: (formData: FormData) => Promise<void>;
  deleteAction?: (formData: FormData) => Promise<void>;
};

export function ProductForm({
  mode,
  categories,
  product,
  action
}: ProductFormProps) {
  const isEdit = mode === "edit";

  return (
    <form action={action} className="grid gap-5 xl:grid-cols-[1fr_22rem]" aria-label="نموذج المنتج">
      <div className="space-y-5">
        <Card className="p-5 shadow-none">
          <h2 className="font-display text-2xl font-bold text-oud-brown">البيانات الأساسية</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Input
              label="اسم المنتج بالعربية"
              name="name_ar"
              defaultValue={product?.name_ar ?? ""}
              required
            />
            <Input
              label="الرابط المختصر"
              name="slug"
              defaultValue={product?.slug ?? ""}
              dir="ltr"
              placeholder="oud-yaz"
              hint={"\u0627\u062A\u0631\u0643\u0647 \u0641\u0627\u0631\u063A\u064B\u0627 \u0644\u064A\u062A\u0645 \u062A\u0648\u0644\u064A\u062F\u0647 \u062A\u0644\u0642\u0627\u0626\u064A\u064B\u0627 \u0645\u0646 \u0627\u0633\u0645 \u0627\u0644\u0645\u0646\u062A\u062C."}
            />
            <Select
              label="التصنيف"
              name="category_id"
              defaultValue={product?.category_id ?? categories[0]?.id ?? ""}
              required
            >
              <option value="" disabled>
                اختر التصنيف
              </option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name_ar}
                </option>
              ))}
            </Select>
            <Input
              label="SKU"
              name="sku"
              defaultValue={product?.sku ?? ""}
              dir="ltr"
              disabled={isEdit}
              hint={
                isEdit
                  ? "\u0644\u0627 \u064A\u062A\u063A\u064A\u0631 SKU \u0639\u0646\u062F \u062A\u0639\u062F\u064A\u0644 \u0627\u0644\u0645\u0646\u062A\u062C."
                  : "\u0627\u062A\u0631\u0643\u0647 \u0641\u0627\u0631\u063A\u064B\u0627 \u0644\u064A\u062A\u0645 \u062A\u0648\u0644\u064A\u062F\u0647 \u062A\u0644\u0642\u0627\u0626\u064A\u064B\u0627."
              }
            />
            <Textarea
              label="الوصف المختصر"
              name="short_description_ar"
              defaultValue={product?.short_description_ar ?? ""}
              className="md:col-span-2"
            />
            <Textarea
              label="الوصف الكامل"
              name="description_ar"
              defaultValue={product?.description_ar ?? ""}
              className="md:col-span-2"
              rows={6}
            />
          </div>
        </Card>

        <Card className="p-5 shadow-none">
          <h2 className="font-display text-2xl font-bold text-oud-brown">
            تفاصيل المنتج والظهور
          </h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Input
              label="العائلة العطرية"
              name="scent_family"
              defaultValue={product?.scent_family ?? ""}
              placeholder="خشبي، مسكي، زهري"
            />
            <Input
              label="القوة"
              name="intensity"
              defaultValue={product?.intensity ?? ""}
              placeholder="خفيف، متوسط، قوي"
            />
            <Input
              label="الوزن بالجرام"
              name="weight_grams"
              type="number"
              min="1"
              defaultValue={product?.weight_grams ?? ""}
            />
            <Input
              label="الحجم بالمل"
              name="volume_ml"
              type="number"
              min="0.01"
              step="0.01"
              defaultValue={product?.volume_ml ?? ""}
            />
            <Textarea
              label="طريقة الاستخدام"
              name="usage_ar"
              defaultValue={product?.usage_ar ?? ""}
            />
            <Textarea
              label="المناسبة"
              name="occasion_ar"
              defaultValue={product?.occasion_ar ?? ""}
            />
          </div>
        </Card>

        <Card className="p-5 shadow-none">
          <h2 className="font-display text-2xl font-bold text-oud-brown">بيانات SEO</h2>
          <div className="mt-5 grid gap-4">
            <Input
              label="عنوان SEO"
              name="meta_title_ar"
              defaultValue={product?.meta_title_ar ?? ""}
            />
            <Textarea
              label="وصف SEO"
              name="meta_description_ar"
              defaultValue={product?.meta_description_ar ?? ""}
            />
            <Textarea
              label="كلمات البحث"
              name="search_keywords_ar"
              defaultValue={product?.search_keywords_ar ?? ""}
              hint={"\u0627\u0641\u0635\u0644 \u0627\u0644\u0643\u0644\u0645\u0627\u062A \u0628\u0641\u0648\u0627\u0635\u0644 \u0639\u0631\u0628\u064A\u0629 \u0623\u0648 \u0625\u0646\u062C\u0644\u064A\u0632\u064A\u0629."}
            />
          </div>
        </Card>
      </div>

      <aside className="space-y-5">
        <Card className="p-5 shadow-none">
          <h2 className="font-display text-2xl font-bold text-oud-brown">السعر والمخزون</h2>
          <div className="mt-5 space-y-4">
            <Input
              label="السعر OMR"
              name="price_omr"
              type="number"
              min="0"
              step="0.001"
              defaultValue={product?.price_omr ?? ""}
              required
            />
            <Input
              label="سعر قبل الخصم"
              name="compare_at_price_omr"
              type="number"
              min="0"
              step="0.001"
              defaultValue={product?.compare_at_price_omr ?? ""}
            />
            <Input
              label="الكمية"
              name="stock_quantity"
              type="number"
              min="0"
              defaultValue={product?.stock_quantity ?? 0}
              required
            />
            <Input
              label="حد التنبيه"
              name="low_stock_threshold"
              type="number"
              min="0"
              defaultValue={product?.low_stock_threshold ?? 5}
              required
            />
          </div>
        </Card>

        <Card className="p-5 shadow-none">
          <h2 className="font-display text-2xl font-bold text-oud-brown">الحالة والوسوم</h2>
          <div className="mt-5 space-y-3">
            <CheckboxField
              name="is_active"
              label="منتج نشط"
              defaultChecked={product?.is_active ?? true}
            />
            <CheckboxField
              name="is_featured"
              label="منتج مميز"
              defaultChecked={product?.is_featured ?? false}
            />
            <CheckboxField
              name="is_best_seller"
              label="الأكثر طلباً"
              defaultChecked={product?.is_best_seller ?? false}
            />
            <CheckboxField
              name="is_new_arrival"
              label="وصل حديثاً"
              defaultChecked={product?.is_new_arrival ?? false}
            />
          </div>
        </Card>

        {!isEdit ? (
          <Card className="p-5 shadow-none">
            <h2 className="font-display text-2xl font-bold text-oud-brown">صور المنتج</h2>
            <div className="mt-5">
              <ImageUploadField
                name="images"
                label="رفع صور المنتج"
                accept="image/jpeg,image/png,image/webp"
                multiple
                helpText="يمكنك اختيار أكثر من صورة. أول صورة تصبح الصورة الأساسية، ويمكن تعديل الترتيب بعد إنشاء المنتج."
                previewAlt="معاينة صور المنتج"
              />
            </div>
          </Card>
        ) : null}

        <Card className="space-y-3 p-5 shadow-none">
          <Button type="submit" className="w-full" leftIcon={<Save className="size-4" />}>
            {isEdit ? "حفظ التعديلات" : "إنشاء المنتج"}
          </Button>
          <Link
            href="/admin/products"
            className="inline-flex h-11 w-full items-center justify-center rounded-oud border border-oud-brown/15 bg-white text-sm font-semibold text-oud-brown transition hover:bg-oud-beige/35"
          >
            العودة للمنتجات
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

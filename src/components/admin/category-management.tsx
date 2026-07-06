import { Save, Trash2 } from "lucide-react";
import { Badge, Button, Card, EmptyState, Input, Textarea } from "@/components/ui";
import {
  createCategoryAction,
  softDeleteCategoryAction,
  updateCategoryAction
} from "@/features/categories/actions";
import type { CategoryAdminRead } from "@/features/categories/queries";

type CategoryManagementProps = {
  categories: CategoryAdminRead[];
};

export function CategoryManagement({ categories }: CategoryManagementProps) {
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_24rem]">
      <div className="space-y-4">
        {categories.length === 0 ? (
          <EmptyState
            title="لا توجد تصنيفات بعد"
            description="أضف التصنيفات الأساسية للعود والبخور والعطور قبل إنشاء المنتجات."
          />
        ) : (
          categories.map((category) => {
            const updateAction = updateCategoryAction.bind(null, category.id);
            const deleteAction = softDeleteCategoryAction.bind(null, category.id);

            return (
              <Card key={category.id} className="p-5 shadow-none">
                <form action={updateAction} className="space-y-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-display text-2xl font-bold text-oud-brown">
                          {category.name_ar}
                        </h2>
                        <Badge variant={category.is_active ? "success" : "soft"}>
                          {category.is_active ? "نشط" : "مخفي"}
                        </Badge>
                        {category.is_featured ? <Badge variant="gold">مميز</Badge> : null}
                      </div>
                      <p className="mt-1 text-xs text-oud-muted">
                        عدد المنتجات: {category.product_count}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        size="sm"
                        leftIcon={<Save className="size-4" />}
                      >
                        حفظ
                      </Button>
                      <Button
                        type="submit"
                        formAction={deleteAction}
                        formNoValidate
                        size="sm"
                        variant="danger"
                        leftIcon={<Trash2 className="size-4" />}
                      >
                        حذف
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Input
                      label="اسم التصنيف"
                      name="name_ar"
                      defaultValue={category.name_ar}
                      required
                    />
                    <Input
                      label="Slug"
                      name="slug"
                      defaultValue={category.slug}
                      dir="ltr"
                      required
                    />
                    <Input
                      label="رابط الصورة"
                      name="image_url"
                      defaultValue={category.image_url ?? ""}
                      dir="ltr"
                    />
                    <Input
                      label="ترتيب الظهور"
                      name="sort_order"
                      type="number"
                      min="0"
                      defaultValue={category.sort_order}
                    />
                    <Textarea
                      label="الوصف"
                      name="description_ar"
                      defaultValue={category.description_ar ?? ""}
                      className="md:col-span-2"
                    />
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <CheckboxField
                      name="is_active"
                      label="تصنيف نشط"
                      defaultChecked={category.is_active}
                    />
                    <CheckboxField
                      name="is_featured"
                      label="تصنيف مميز"
                      defaultChecked={category.is_featured}
                    />
                  </div>
                </form>
              </Card>
            );
          })
        )}
      </div>

      <Card className="p-5 shadow-none">
        <h2 className="font-display text-2xl font-bold text-oud-brown">إضافة تصنيف</h2>
        <form action={createCategoryAction} className="mt-5 space-y-4">
          <Input label="اسم التصنيف" name="name_ar" placeholder="مثال: العود" required />
          <Input label="Slug" name="slug" placeholder="oud" dir="ltr" required />
          <Input label="رابط الصورة" name="image_url" dir="ltr" />
          <Input label="ترتيب الظهور" name="sort_order" type="number" min="0" defaultValue={0} />
          <Textarea label="الوصف" name="description_ar" />
          <CheckboxField name="is_active" label="تصنيف نشط" defaultChecked />
          <CheckboxField name="is_featured" label="تصنيف مميز" defaultChecked={false} />
          <Button type="submit" className="w-full" leftIcon={<Save className="size-4" />}>
            حفظ التصنيف
          </Button>
        </form>
      </Card>
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
    <label className="inline-flex items-center gap-2 rounded-full border border-oud-brown/10 bg-oud-pearl px-4 py-2 text-xs font-semibold text-oud-brown">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="size-4 accent-oud-gold"
      />
      {label}
    </label>
  );
}

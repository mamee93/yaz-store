import { ArrowDown, ArrowUp, ImageIcon, Star, Trash2, Upload } from "lucide-react";
import { ConfirmActionButton } from "@/components/admin/confirm-action-button";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { Badge, Button, Card, EmptyState } from "@/components/ui";
import {
  deleteProductImageAction,
  moveProductImageAction,
  setPrimaryProductImageAction,
  uploadProductImagesAction
} from "@/features/products/image-actions";
import type { ProductImageRow } from "@/features/products/queries";

type ProductImageUploaderProps = {
  productId: string;
  images: ProductImageRow[];
};

export function ProductImageUploader({ productId, images }: ProductImageUploaderProps) {
  const uploadAction = uploadProductImagesAction.bind(null, productId);
  const sortedImages = [...images].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <Card className="space-y-5 p-5 shadow-none">
      <div>
        <p className="text-xs font-semibold text-oud-gold">صور المنتج</p>
        <h2 className="mt-2 font-display text-2xl font-bold text-oud-brown">
          إدارة معرض المنتج
        </h2>
        <p className="mt-2 text-sm leading-7 text-oud-muted">
          ارفع عدة صور، اختر الصورة الأساسية، وغير ترتيب الصور في معرض المنتج.
        </p>
      </div>

      <form action={uploadAction} className="space-y-3">
        <ImageUploadField
          name="images"
          label="رفع صور جديدة"
          accept="image/jpeg,image/png,image/webp"
          multiple
          helpText="JPG, PNG, WEBP. الحد الأقصى 5MB للصورة الواحدة."
          previewAlt="معاينة صور المنتج"
        />
        <Button type="submit" leftIcon={<Upload className="size-4" />}>
          رفع الصور
        </Button>
      </form>

      {sortedImages.length === 0 ? (
        <EmptyState
          title="لا توجد صور بعد"
          description="ستظهر الصور هنا بعد رفعها. أول صورة مرفوعة تصبح الصورة الأساسية تلقائيا."
          icon={<ImageIcon className="size-5" aria-hidden="true" />}
          className="py-8"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sortedImages.map((image) => {
            const imageUrl = image.image_url ?? image.public_url;
            const deleteAction = deleteProductImageAction.bind(null, image.id);
            const setPrimaryAction = setPrimaryProductImageAction.bind(null, image.id);
            const moveUpAction = moveProductImageAction.bind(null, image.id, "up");
            const moveDownAction = moveProductImageAction.bind(null, image.id, "down");

            return (
              <div
                key={image.id}
                className="overflow-hidden rounded-oud border border-oud-brown/10 bg-oud-pearl"
              >
                <div className="aspect-[4/3] bg-oud-beige/45">
                  {imageUrl ? (
                    <div
                      role="img"
                      aria-label={image.alt_text_ar ?? "صورة المنتج"}
                      className="h-full w-full object-cover"
                      style={{ background: `url("${imageUrl}") center/cover` }}
                    />
                  ) : (
                    <div className="grid h-full place-items-center text-oud-muted">
                      <ImageIcon className="size-8" aria-hidden="true" />
                    </div>
                  )}
                </div>
                <div className="space-y-3 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs text-oud-muted" dir="ltr">
                      {image.storage_path}
                    </span>
                    {image.is_primary ? <Badge variant="gold">أساسية</Badge> : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <form action={moveUpAction}>
                      <Button
                        type="submit"
                        size="sm"
                        variant="secondary"
                        leftIcon={<ArrowUp className="size-4" />}
                      >
                        أعلى
                      </Button>
                    </form>
                    <form action={moveDownAction}>
                      <Button
                        type="submit"
                        size="sm"
                        variant="secondary"
                        leftIcon={<ArrowDown className="size-4" />}
                      >
                        أسفل
                      </Button>
                    </form>
                    {!image.is_primary ? (
                      <form action={setPrimaryAction}>
                        <Button
                          type="submit"
                          size="sm"
                          variant="secondary"
                          leftIcon={<Star className="size-4" />}
                        >
                          تعيين أساسية
                        </Button>
                      </form>
                    ) : null}
                    <ConfirmActionButton
                      action={deleteAction}
                      triggerLabel="حذف"
                      confirmLabel="حذف نهائي"
                      title="حذف صورة المنتج"
                      description="سيتم حذف الصورة من معرض المنتج ومن التخزين."
                      itemName={image.alt_text_ar ?? image.storage_path}
                      variant="danger"
                      size="sm"
                      icon={<Trash2 className="size-4" />}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

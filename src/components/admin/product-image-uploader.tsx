import { ImageIcon, Star, Trash2, Upload } from "lucide-react";
import { Badge, Button, Card, EmptyState, Input } from "@/components/ui";
import {
  deleteProductImageAction,
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
  const sortedImages = [...images].sort((a, b) => {
    if (a.is_primary && !b.is_primary) {
      return -1;
    }

    if (!a.is_primary && b.is_primary) {
      return 1;
    }

    return a.sort_order - b.sort_order;
  });

  return (
    <Card className="space-y-5 p-5 shadow-none">
      <div>
        <p className="text-xs font-semibold text-oud-gold">صور المنتج</p>
        <h2 className="mt-2 font-display text-2xl font-bold text-oud-brown">
          إدارة صور المنتج
        </h2>
        <p className="mt-2 text-sm leading-7 text-oud-muted">
          ارفع صور JPG أو PNG أو WEBP بحجم لا يتجاوز 5MB للصورة الواحدة.
        </p>
      </div>

      <form action={uploadAction} className="space-y-3">
        <Input
          label="رفع صور جديدة"
          name="images"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
        />
        <Button type="submit" leftIcon={<Upload className="size-4" />}>
          رفع الصور
        </Button>
      </form>

      {sortedImages.length === 0 ? (
        <EmptyState
          title="لا توجد صور بعد"
          description="ستظهر الصور هنا بعد رفعها، وستصبح أول صورة مرفوعة هي الصورة الأساسية."
          icon={<ImageIcon className="size-5" aria-hidden="true" />}
          className="py-8"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sortedImages.map((image) => {
            const deleteAction = deleteProductImageAction.bind(null, image.id);
            const setPrimaryAction = setPrimaryProductImageAction.bind(null, image.id);

            return (
              <div
                key={image.id}
                className="overflow-hidden rounded-oud border border-oud-brown/10 bg-oud-pearl"
              >
                <div className="aspect-[4/3] bg-oud-beige/45">
                  {image.public_url ? (
                    <div
                      role="img"
                      aria-label={image.alt_text_ar ?? "صورة المنتج"}
                      className="h-full w-full object-cover"
                      style={{ background: `url("${image.public_url}") center/cover` }}
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
                    <form action={deleteAction}>
                      <Button
                        type="submit"
                        size="sm"
                        variant="danger"
                        leftIcon={<Trash2 className="size-4" />}
                      >
                        حذف
                      </Button>
                    </form>
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

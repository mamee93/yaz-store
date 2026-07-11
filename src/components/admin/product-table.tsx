import Link from "next/link";
import { Edit, Trash2 } from "lucide-react";
import { ConfirmActionButton } from "@/components/admin/confirm-action-button";
import { Badge, Card, EmptyState, Price } from "@/components/ui";
import { softDeleteProductAction } from "@/features/products/actions";
import type { ProductRow } from "@/features/products/queries";

type ProductTableProps = {
  products: ProductRow[];
};

export function ProductTable({ products }: ProductTableProps) {
  if (products.length === 0) {
    return (
      <EmptyState
        title="لا توجد منتجات بعد"
        description="ابدأ بإضافة أول منتج حقيقي في كتالوج عود ياز."
        action={
          <Link
            href="/admin/products/new"
            className="inline-flex h-10 items-center justify-center rounded-oud bg-oud-brown px-4 text-sm font-semibold text-oud-ivory"
          >
            إضافة منتج
          </Link>
        }
      />
    );
  }

  return (
    <Card className="overflow-hidden shadow-none">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[56rem] text-right text-sm">
          <thead className="bg-oud-beige/35 text-xs text-oud-muted">
            <tr>
              <th className="px-5 py-3 font-semibold">المنتج</th>
              <th className="px-5 py-3 font-semibold">التصنيف</th>
              <th className="px-5 py-3 font-semibold">SKU</th>
              <th className="px-5 py-3 font-semibold">السعر</th>
              <th className="px-5 py-3 font-semibold">المخزون</th>
              <th className="px-5 py-3 font-semibold">الحالة</th>
              <th className="px-5 py-3 font-semibold">إجراء</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-oud-brown/10">
            {products.map((product) => {
              const deleteAction = softDeleteProductAction.bind(null, product.id);
              const isLowStock = product.stock_quantity <= product.low_stock_threshold;

              return (
                <tr key={product.id} className="bg-oud-pearl">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span
                        className="size-12 rounded-oud bg-oud-beige"
                        aria-hidden="true"
                        style={{ background: getProductImageBackground(product) }}
                      />
                      <span>
                        <span className="block font-semibold text-oud-brown">
                          {product.name_ar}
                        </span>
                        <span className="mt-1 flex flex-wrap gap-1">
                          {product.is_featured ? <Badge variant="gold">مميز</Badge> : null}
                          {product.is_best_seller ? <Badge variant="soft">الأكثر طلباً</Badge> : null}
                          {product.is_new_arrival ? <Badge variant="soft">جديد</Badge> : null}
                        </span>
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-oud-muted">
                    {product.categories?.name_ar ?? "بدون تصنيف"}
                  </td>
                  <td className="px-5 py-4 text-oud-muted" dir="ltr">
                    {product.sku ?? "-"}
                  </td>
                  <td className="px-5 py-4">
                    <Price value={product.price_omr} />
                  </td>
                  <td className="px-5 py-4">
                    <span className={isLowStock ? "font-semibold text-red-900" : undefined}>
                      {product.stock_quantity}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <Badge variant={product.is_active ? "success" : "soft"}>
                      {product.is_active ? "نشط" : "مسودة"}
                    </Badge>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className="inline-flex items-center gap-2 text-xs font-semibold text-oud-brown"
                      >
                        <Edit className="size-4" aria-hidden="true" />
                        تعديل
                      </Link>
                      <ConfirmActionButton
                        action={deleteAction}
                        triggerLabel="حذف"
                        confirmLabel="تعطيل المنتج"
                        title="حذف المنتج"
                        description="سيتم إخفاء المنتج من المتجر وتعطيله للحفاظ على سجل الطلبات."
                        itemName={product.name_ar}
                        variant="danger"
                        size="sm"
                        icon={<Trash2 className="size-4" />}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function getProductImageBackground(product: ProductRow) {
  const primaryImage = product.product_images?.find((image) => image.is_primary);
  const fallbackImage = product.product_images?.[0];
  const imageUrl =
    primaryImage?.image_url ??
    primaryImage?.public_url ??
    fallbackImage?.image_url ??
    fallbackImage?.public_url;

  return imageUrl ? `url("${imageUrl}") center/cover` : undefined;
}

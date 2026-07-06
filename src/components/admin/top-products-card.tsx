import { Card, EmptyState, Price } from "@/components/ui";
import type { TopProductItem } from "@/features/analytics/queries";

type TopProductsCardProps = {
  products: TopProductItem[];
};

export function TopProductsCard({ products }: TopProductsCardProps) {
  return (
    <Card className="p-5 shadow-none">
      <h2 className="font-display text-2xl font-bold text-oud-brown">أفضل المنتجات</h2>
      <p className="mt-1 text-xs text-oud-muted">حسب الإيرادات والكمية المباعة</p>
      {products.length === 0 ? (
        <EmptyState title="لا توجد مبيعات منتجات" description="ستظهر المنتجات بعد إنشاء الطلبات." />
      ) : (
        <div className="mt-5 space-y-4">
          {products.map((product) => (
            <div key={`${product.productId ?? product.name}`} className="rounded-oud bg-oud-beige/30 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-oud-brown">{product.name}</p>
                  <p className="mt-1 text-xs text-oud-muted" dir="ltr">
                    {product.sku ?? "بدون SKU"}
                  </p>
                </div>
                <Price value={product.revenue} />
              </div>
              <p className="mt-2 text-xs text-oud-muted">الكمية: {product.quantitySold}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

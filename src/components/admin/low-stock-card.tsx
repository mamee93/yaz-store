import Link from "next/link";
import { Badge, Card, EmptyState } from "@/components/ui";
import type { LowStockProductItem } from "@/features/analytics/queries";

type LowStockCardProps = {
  products: LowStockProductItem[];
};

export function LowStockCard({ products }: LowStockCardProps) {
  return (
    <Card className="p-5 shadow-none">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold text-oud-brown">تنبيهات المخزون</h2>
          <p className="mt-1 text-xs text-oud-muted">منتجات وصلت إلى حد التنبيه أو أقل</p>
        </div>
        <Link href="/admin/inventory" className="text-xs font-semibold text-oud-brown">
          المخزون
        </Link>
      </div>
      {products.length === 0 ? (
        <EmptyState title="المخزون جيد" description="لا توجد منتجات منخفضة المخزون حاليا." />
      ) : (
        <div className="mt-5 space-y-3">
          {products.map((product) => (
            <div key={product.id} className="flex items-center justify-between gap-3 rounded-oud bg-oud-beige/30 p-4">
              <div className="min-w-0">
                <p className="font-semibold text-oud-brown">{product.name}</p>
                <p className="mt-1 text-xs text-oud-muted" dir="ltr">
                  {product.sku ?? "بدون SKU"}
                </p>
              </div>
              <Badge variant="danger">
                {product.stock} / {product.threshold}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

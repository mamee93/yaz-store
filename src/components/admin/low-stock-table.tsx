import { Badge, Card } from "@/components/ui";

const lowStockProducts = [
  { name: "عطر ياز الشرقي", sku: "OY-PER-003", stock: 3, threshold: 5 },
  { name: "مسك أبيض ناعم", sku: "OY-MSK-004", stock: 4, threshold: 6 },
  { name: "هدية ياز الصغيرة", sku: "OY-GFT-008", stock: 2, threshold: 5 }
];

export function LowStockTable() {
  return (
    <Card className="overflow-hidden shadow-none">
      <div className="border-b border-oud-brown/10 p-5">
        <h2 className="font-display text-2xl font-bold text-oud-brown">
          منتجات منخفضة المخزون
        </h2>
        <p className="mt-1 text-xs text-oud-muted">تنبيهات ثابتة لحين ربط المخزون</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[32rem] text-right text-sm">
          <thead className="bg-oud-beige/35 text-xs text-oud-muted">
            <tr>
              <th className="px-5 py-3 font-semibold">المنتج</th>
              <th className="px-5 py-3 font-semibold">SKU</th>
              <th className="px-5 py-3 font-semibold">المتوفر</th>
              <th className="px-5 py-3 font-semibold">الحد الأدنى</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-oud-brown/10">
            {lowStockProducts.map((product) => (
              <tr key={product.sku} className="bg-oud-pearl">
                <td className="px-5 py-4 font-semibold text-oud-brown">{product.name}</td>
                <td className="px-5 py-4 text-oud-muted" dir="ltr">
                  {product.sku}
                </td>
                <td className="px-5 py-4">
                  <Badge variant="danger">{product.stock} قطع</Badge>
                </td>
                <td className="px-5 py-4 text-oud-muted">{product.threshold} قطع</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

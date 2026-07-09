import { Badge, Card, Input, Select, Textarea } from "@/components/ui";
import { adminInventory } from "./admin-static-data";

export function InventoryManagement() {
  return (
    <div className="min-w-0 space-y-5">
      <Card className="max-w-4xl p-5 shadow-none">
        <h2 className="font-display text-2xl font-bold text-oud-brown">تعديل المخزون</h2>
        <div className="mt-5 space-y-4">
          <Select label="المنتج" name="inventoryProduct" defaultValue="OY-PER-003">
            <option value="OY-PER-003">عطر ياز الشرقي</option>
            <option value="OY-MSK-004">مسك أبيض ناعم</option>
            <option value="OY-GFT-008">هدية ياز الصغيرة</option>
          </Select>
          <Select label="نوع الحركة" name="movementType" defaultValue="restock">
            <option value="restock">إضافة مخزون</option>
            <option value="adjustment">تعديل</option>
            <option value="damage">تالف</option>
          </Select>
          <Input label="الكمية" name="quantity" type="number" />
          <Textarea label="السبب" name="reason" />
          <div className="rounded-oud bg-oud-brown px-5 py-3 text-center text-sm font-semibold text-oud-ivory">
            حفظ حركة تجريبية
          </div>
        </div>
      </Card>

      <Card className="min-w-0 overflow-hidden shadow-none">
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[44rem] text-right text-sm">
            <thead className="bg-oud-beige/35 text-xs text-oud-muted">
              <tr>
                <th className="px-5 py-3 font-semibold">المنتج</th>
                <th className="px-5 py-3 font-semibold">SKU</th>
                <th className="px-5 py-3 font-semibold">المخزون</th>
                <th className="px-5 py-3 font-semibold">حد التنبيه</th>
                <th className="px-5 py-3 font-semibold">آخر حركة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-oud-brown/10">
              {adminInventory.map((item) => (
                <tr key={item.id} className="bg-oud-pearl">
                  <td className="px-5 py-4 font-semibold text-oud-brown">{item.product}</td>
                  <td className="px-5 py-4 text-oud-muted" dir="ltr">
                    {item.sku}
                  </td>
                  <td className="px-5 py-4">
                    <Badge variant={item.stock <= item.threshold ? "danger" : "success"}>
                      {item.stock} قطع
                    </Badge>
                  </td>
                  <td className="px-5 py-4 text-oud-muted">{item.threshold}</td>
                  <td className="px-5 py-4 text-oud-muted">{item.lastMovement}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

import { Badge, Card, Price } from "@/components/ui";

const recentOrders = [
  {
    orderNumber: "OY-000128",
    customer: "أحمد الهاشمي",
    phone: "9XXXX123",
    status: "قيد التأكيد",
    total: 52.5,
    date: "اليوم"
  },
  {
    orderNumber: "OY-000127",
    customer: "مريم البلوشية",
    phone: "9XXXX884",
    status: "قيد التجهيز",
    total: 28,
    date: "اليوم"
  },
  {
    orderNumber: "OY-000126",
    customer: "سالم الحارثي",
    phone: "9XXXX451",
    status: "مكتمل",
    total: 19.75,
    date: "أمس"
  }
];

export function RecentOrdersTable() {
  return (
    <Card className="overflow-hidden shadow-none">
      <div className="border-b border-oud-brown/10 p-5">
        <h2 className="font-display text-2xl font-bold text-oud-brown">أحدث الطلبات</h2>
        <p className="mt-1 text-xs text-oud-muted">بيانات ثابتة للعرض فقط</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[42rem] text-right text-sm">
          <thead className="bg-oud-beige/35 text-xs text-oud-muted">
            <tr>
              <th className="px-5 py-3 font-semibold">رقم الطلب</th>
              <th className="px-5 py-3 font-semibold">العميل</th>
              <th className="px-5 py-3 font-semibold">الهاتف</th>
              <th className="px-5 py-3 font-semibold">الحالة</th>
              <th className="px-5 py-3 font-semibold">الإجمالي</th>
              <th className="px-5 py-3 font-semibold">التاريخ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-oud-brown/10">
            {recentOrders.map((order) => (
              <tr key={order.orderNumber} className="bg-oud-pearl">
                <td className="px-5 py-4 font-semibold text-oud-brown" dir="ltr">
                  {order.orderNumber}
                </td>
                <td className="px-5 py-4 text-oud-ink">{order.customer}</td>
                <td className="px-5 py-4 text-oud-muted" dir="ltr">
                  {order.phone}
                </td>
                <td className="px-5 py-4">
                  <Badge variant={order.status === "مكتمل" ? "success" : "gold"}>
                    {order.status}
                  </Badge>
                </td>
                <td className="px-5 py-4">
                  <Price value={order.total} />
                </td>
                <td className="px-5 py-4 text-oud-muted">{order.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

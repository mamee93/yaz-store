import Link from "next/link";
import { Eye } from "lucide-react";
import { Card, EmptyState, Price } from "@/components/ui";
import type { AdminCustomerListItem } from "@/features/customers/queries";

type CustomersTableProps = {
  customers: AdminCustomerListItem[];
};

export function CustomersTable({ customers }: CustomersTableProps) {
  if (customers.length === 0) {
    return (
      <EmptyState
        title="لا توجد نتائج للعملاء"
        description="سيظهر العملاء هنا بعد إنشاء الطلبات، أو جرّب تعديل عبارة البحث."
      />
    );
  }

  return (
    <Card className="overflow-hidden shadow-none">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[58rem] text-right text-sm">
          <thead className="bg-oud-beige/35 text-xs text-oud-muted">
            <tr>
              <th className="px-5 py-3 font-semibold">العميل</th>
              <th className="px-5 py-3 font-semibold">الهاتف</th>
              <th className="px-5 py-3 font-semibold">البريد</th>
              <th className="px-5 py-3 font-semibold">تاريخ التسجيل</th>
              <th className="px-5 py-3 font-semibold">الطلبات</th>
              <th className="px-5 py-3 font-semibold">إجمالي الشراء</th>
              <th className="px-5 py-3 font-semibold">آخر طلب</th>
              <th className="px-5 py-3 font-semibold">إجراء</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-oud-brown/10">
            {customers.map((customer) => (
              <tr key={customer.id} className="bg-oud-pearl">
                <td className="px-5 py-4 font-semibold text-oud-brown">{customer.full_name}</td>
                <td className="px-5 py-4 text-oud-muted" dir="ltr">
                  {customer.phone}
                </td>
                <td className="px-5 py-4 text-oud-muted" dir="ltr">
                  {customer.email ?? "-"}
                </td>
                <td className="px-5 py-4 text-oud-muted">{formatDate(customer.created_at)}</td>
                <td className="px-5 py-4 text-oud-muted">{customer.total_orders}</td>
                <td className="px-5 py-4">
                  <Price value={customer.total_spent_omr} />
                </td>
                <td className="px-5 py-4 text-oud-muted">
                  {customer.last_order_at ? formatDate(customer.last_order_at) : "-"}
                </td>
                <td className="px-5 py-4">
                  <Link
                    href={`/admin/customers/${customer.id}`}
                    className="inline-flex items-center gap-2 text-xs font-semibold text-oud-brown"
                  >
                    <Eye className="size-4" aria-hidden="true" />
                    التفاصيل
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ar-OM", {
    dateStyle: "medium"
  }).format(new Date(value));
}

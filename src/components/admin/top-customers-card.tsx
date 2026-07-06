import Link from "next/link";
import { Card, EmptyState, Price } from "@/components/ui";
import type { TopCustomerItem } from "@/features/analytics/queries";

type TopCustomersCardProps = {
  customers: TopCustomerItem[];
};

export function TopCustomersCard({ customers }: TopCustomersCardProps) {
  return (
    <Card className="p-5 shadow-none">
      <h2 className="font-display text-2xl font-bold text-oud-brown">أفضل العملاء</h2>
      <p className="mt-1 text-xs text-oud-muted">حسب إجمالي الشراء</p>
      {customers.length === 0 ? (
        <EmptyState title="لا توجد بيانات عملاء" description="ستظهر بيانات العملاء بعد أول طلب." />
      ) : (
        <div className="mt-5 space-y-4">
          {customers.map((customer) => (
            <Link
              key={customer.customerId}
              href={`/admin/customers/${customer.customerId}`}
              className="block rounded-oud bg-oud-beige/30 p-4 transition hover:bg-oud-beige/50"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-oud-brown">{customer.name}</p>
                  <p className="mt-1 text-xs text-oud-muted" dir="ltr">
                    {customer.phone}
                  </p>
                </div>
                <Price value={customer.totalSpent} />
              </div>
              <p className="mt-2 text-xs text-oud-muted">عدد الطلبات: {customer.orders}</p>
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}

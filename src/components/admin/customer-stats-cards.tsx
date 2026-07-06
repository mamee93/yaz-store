import { CalendarClock, ShoppingBag, TrendingUp, Wallet } from "lucide-react";
import { Card, Price } from "@/components/ui";
import type { AdminCustomerDetail } from "@/features/customers/queries";

type CustomerStatsCardsProps = {
  customer: AdminCustomerDetail;
};

export function CustomerStatsCards({ customer }: CustomerStatsCardsProps) {
  const stats = [
    {
      label: "إجمالي الطلبات",
      value: customer.total_orders.toString(),
      icon: ShoppingBag
    },
    {
      label: "إجمالي الشراء",
      value: <Price value={customer.total_spent_omr} />,
      icon: Wallet
    },
    {
      label: "متوسط الطلب",
      value: <Price value={customer.average_order_value_omr} />,
      icon: TrendingUp
    },
    {
      label: "آخر طلب",
      value: customer.last_order ? formatDate(customer.last_order.created_at) : "-",
      icon: CalendarClock
    }
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="p-5 shadow-none">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-oud-muted">{stat.label}</p>
              <div className="mt-2 text-xl font-bold text-oud-brown">{stat.value}</div>
            </div>
            <span className="inline-flex size-10 items-center justify-center rounded-oud bg-oud-gold/15 text-oud-brown">
              <stat.icon className="size-5" aria-hidden="true" />
            </span>
          </div>
        </Card>
      ))}
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ar-OM", {
    dateStyle: "medium"
  }).format(new Date(value));
}

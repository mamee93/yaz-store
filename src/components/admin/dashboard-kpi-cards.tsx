import {
  CalendarDays,
  ClipboardList,
  TrendingUp,
  UserPlus,
  WalletCards
} from "lucide-react";
import { Card, Price } from "@/components/ui";
import type { DashboardAnalytics } from "@/features/analytics/queries";

type DashboardKpiCardsProps = {
  kpis: DashboardAnalytics["kpis"];
};

export function DashboardKpiCards({ kpis }: DashboardKpiCardsProps) {
  const items = [
    {
      label: "مبيعات اليوم",
      value: <Price value={kpis.todayRevenue} className="text-2xl" />,
      hint: "الطلبات المكتملة فقط",
      icon: WalletCards
    },
    {
      label: "مبيعات آخر 30 يوما",
      value: <Price value={kpis.last30DaysRevenue} className="text-2xl" />,
      hint: "status = completed",
      icon: TrendingUp
    },
    {
      label: "طلبات اليوم",
      value: kpis.todayOrders.toString(),
      hint: "حسب تاريخ إنشاء الطلب",
      icon: CalendarDays
    },
    {
      label: "الطلبات المكتملة",
      value: kpis.completedOrders.toString(),
      hint: "إجمالي الطلبات المكتملة",
      icon: ClipboardList
    },
    {
      label: "قيد التنفيذ",
      value: kpis.inProgressOrders.toString(),
      hint: "confirmed / preparing / out_for_delivery",
      icon: ClipboardList
    },
    {
      label: "الطلبات الملغاة",
      value: kpis.cancelledOrders.toString(),
      hint: "status = cancelled",
      icon: ClipboardList
    },
    {
      label: "متوسط قيمة الطلب",
      value: <Price value={kpis.averageOrderValue} className="text-2xl" />,
      hint: "إجمالي المبيعات / الطلبات المكتملة",
      icon: TrendingUp
    },
    {
      label: "عملاء جدد خلال 30 يوما",
      value: kpis.newCustomers30Days.toString(),
      hint: "حسب تاريخ إنشاء العميل",
      icon: UserPlus
    }
  ];

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(15rem,100%),1fr))] gap-4 xl:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <Card key={item.label} className="p-4 shadow-none sm:p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-oud-muted">{item.label}</p>
                <div className="mt-3 break-words text-xl font-bold text-oud-brown sm:text-2xl">{item.value}</div>
              </div>
              <span className="grid size-11 place-items-center rounded-oud bg-oud-brown text-oud-gold">
                <Icon className="size-5" aria-hidden="true" />
              </span>
            </div>
            <p className="mt-4 text-xs leading-6 text-oud-muted">{item.hint}</p>
          </Card>
        );
      })}
    </div>
  );
}

import {
  CalendarDays,
  ClipboardList,
  TrendingUp,
  Users,
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
      label: "إجمالي الإيرادات",
      value: <Price value={kpis.totalRevenue} className="text-2xl" />,
      hint: "باستثناء الطلبات الملغاة",
      icon: WalletCards
    },
    {
      label: "إجمالي الطلبات",
      value: kpis.totalOrders.toString(),
      hint: "كل الحالات",
      icon: ClipboardList
    },
    {
      label: "إجمالي العملاء",
      value: kpis.totalCustomers.toString(),
      hint: "عملاء checkout",
      icon: Users
    },
    {
      label: "متوسط الطلب",
      value: <Price value={kpis.averageOrderValue} className="text-2xl" />,
      hint: "إيرادات / الطلبات غير الملغاة",
      icon: TrendingUp
    },
    {
      label: "إيرادات اليوم",
      value: <Price value={kpis.todayRevenue} className="text-2xl" />,
      hint: "حسب تاريخ إنشاء الطلب",
      icon: CalendarDays
    },
    {
      label: "إيرادات الشهر",
      value: <Price value={kpis.monthRevenue} className="text-2xl" />,
      hint: "الشهر الحالي",
      icon: TrendingUp
    }
  ];

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(16rem,100%),1fr))] gap-4 xl:grid-cols-3">
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

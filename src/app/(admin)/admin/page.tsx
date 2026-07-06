import { Boxes, ClipboardList, TrendingUp, WalletCards } from "lucide-react";
import { AdminQuickActions } from "@/components/admin/admin-quick-actions";
import { DashboardStatCard } from "@/components/admin/dashboard-stat-card";
import { LowStockTable } from "@/components/admin/low-stock-table";
import { RecentOrdersTable } from "@/components/admin/recent-orders-table";

const dashboardStats = [
  {
    title: "طلبات اليوم",
    value: "12",
    description: "طلبات جديدة بانتظار المتابعة.",
    icon: ClipboardList
  },
  {
    title: "الطلبات المعلقة",
    value: "7",
    description: "تحتاج تأكيد أو مراجعة دفع.",
    icon: WalletCards,
    tone: "warning" as const
  },
  {
    title: "مبيعات الشهر",
    value: "1,248 OMR",
    description: "إجمالي ثابت للعرض فقط.",
    icon: TrendingUp,
    tone: "success" as const
  },
  {
    title: "منتجات منخفضة المخزون",
    value: "3",
    description: "منتجات وصلت إلى حد التنبيه.",
    icon: Boxes,
    tone: "warning" as const
  }
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold text-oud-gold">لوحة التحكم</p>
        <h1 className="font-display text-3xl font-bold text-oud-brown md:text-4xl">
          نظرة عامة على المتجر
        </h1>
        <p className="max-w-2xl text-sm leading-7 text-oud-muted">
          واجهة ثابتة لمتابعة الطلبات، المبيعات، المخزون، والإجراءات اليومية.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardStats.map((stat) => (
          <DashboardStatCard key={stat.title} {...stat} />
        ))}
      </div>

      <AdminQuickActions />

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <RecentOrdersTable />
        <LowStockTable />
      </div>
    </div>
  );
}

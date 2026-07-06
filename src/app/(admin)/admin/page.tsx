import { AdminQuickActions } from "@/components/admin/admin-quick-actions";
import { CouponPerformanceCard } from "@/components/admin/coupon-performance-card";
import { DashboardKpiCards } from "@/components/admin/dashboard-kpi-cards";
import { LowStockCard } from "@/components/admin/low-stock-card";
import { OrdersStatusChart } from "@/components/admin/orders-status-chart";
import { RecentOrdersCard } from "@/components/admin/recent-orders-card";
import { SalesChart } from "@/components/admin/sales-chart";
import { TopCustomersCard } from "@/components/admin/top-customers-card";
import { TopProductsCard } from "@/components/admin/top-products-card";
import { getDashboardAnalytics } from "@/features/analytics/queries";

export default async function AdminDashboardPage() {
  const analytics = await getDashboardAnalytics();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold text-oud-gold">لوحة التحكم</p>
        <h1 className="font-display text-3xl font-bold text-oud-brown md:text-4xl">
          نظرة عامة على المتجر
        </h1>
        <p className="max-w-2xl text-sm leading-7 text-oud-muted">
          مؤشرات تشغيلية حقيقية للطلبات، الإيرادات، العملاء، المنتجات، المخزون، والكوبونات.
        </p>
      </div>

      <DashboardKpiCards kpis={analytics.kpis} />

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
        <SalesChart
          title="مبيعات آخر 7 أيام"
          description="الإيرادات اليومية باستثناء الطلبات الملغاة"
          points={analytics.sales7Days}
        />
        <OrdersStatusChart statusCounts={analytics.statusCounts} />
      </div>

      <SalesChart
        title="اتجاه المبيعات آخر 30 يوم"
        description="نظرة شهرية مبسطة بدون مكتبات رسوم خارجية"
        points={analytics.sales30Days}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <TopProductsCard products={analytics.topProducts} />
        <TopCustomersCard customers={analytics.topCustomers} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <RecentOrdersCard orders={analytics.recentOrders} />
        <LowStockCard products={analytics.lowStockProducts} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <CouponPerformanceCard coupons={analytics.couponPerformance} />
        <AdminQuickActions />
      </div>
    </div>
  );
}

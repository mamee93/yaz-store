import { AdminQuickActions } from "@/components/admin/admin-quick-actions";
import { CouponPerformanceCard } from "@/components/admin/coupon-performance-card";
import { DashboardKpiCards } from "@/components/admin/dashboard-kpi-cards";
import { LowStockCard } from "@/components/admin/low-stock-card";
import { OrdersStatusChart } from "@/components/admin/orders-status-chart";
import { RecentOrdersCard } from "@/components/admin/recent-orders-card";
import { SalesChart } from "@/components/admin/sales-chart";
import { TopCustomersCard } from "@/components/admin/top-customers-card";
import { TopProductsCard } from "@/components/admin/top-products-card";
import { requireAdmin } from "@/features/auth/queries";
import { getDashboardAnalytics } from "@/features/analytics/queries";

export default async function AdminDashboardPage() {
  const [admin, analytics] = await Promise.all([requireAdmin(), getDashboardAnalytics()]);
  const canUseQuickActions = admin?.role === "owner" || admin?.role === "manager";

  return (
    <div className="min-w-0 space-y-5 sm:space-y-6">
      <div className="flex min-w-0 flex-col gap-2">
        <p className="text-xs font-semibold text-oud-gold">لوحة التحكم</p>
        <h1 className="text-pretty font-display text-2xl font-bold text-oud-brown sm:text-3xl md:text-4xl">
          نظرة عامة على المتجر
        </h1>
        <p className="max-w-2xl text-sm leading-7 text-oud-muted">
          مؤشرات تشغيلية حقيقية للطلبات، الإيرادات، العملاء، المنتجات، المخزون، والكوبونات.
        </p>
      </div>

      <DashboardKpiCards kpis={analytics.kpis} />

      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,0.6fr)] xl:gap-6">
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

      <div className="grid min-w-0 gap-5 xl:grid-cols-2 xl:gap-6">
        <TopProductsCard products={analytics.topProducts} />
        <TopCustomersCard customers={analytics.topCustomers} />
      </div>

      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] xl:gap-6">
        <RecentOrdersCard orders={analytics.recentOrders} />
        <LowStockCard products={analytics.lowStockProducts} />
      </div>

      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] xl:gap-6">
        <CouponPerformanceCard coupons={analytics.couponPerformance} />
        {canUseQuickActions ? <AdminQuickActions /> : null}
      </div>
    </div>
  );
}

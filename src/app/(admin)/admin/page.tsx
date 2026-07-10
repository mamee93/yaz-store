import Link from "next/link";
import { AdminQuickActions } from "@/components/admin/admin-quick-actions";
import { CouponPerformanceCard } from "@/components/admin/coupon-performance-card";
import { DashboardKpiCards } from "@/components/admin/dashboard-kpi-cards";
import { LowStockCard } from "@/components/admin/low-stock-card";
import { OrdersStatusChart } from "@/components/admin/orders-status-chart";
import { RecentOrdersCard } from "@/components/admin/recent-orders-card";
import { SalesChart } from "@/components/admin/sales-chart";
import { TopCustomersCard } from "@/components/admin/top-customers-card";
import { TopProductsCard } from "@/components/admin/top-products-card";
import { Badge, Card, EmptyState, Price } from "@/components/ui";
import { getAuditActionLabel } from "@/features/admin-audit/labels";
import { getAdminAuditLogs } from "@/features/admin-audit/queries";
import { getAdminTeamPerformance } from "@/features/admin-team/performance-queries";
import { requireAdmin } from "@/features/auth/queries";
import { getDashboardAnalytics } from "@/features/analytics/queries";

export default async function AdminDashboardPage() {
  const [admin, analytics, teamPerformance, activity] = await Promise.all([
    requireAdmin(),
    getDashboardAnalytics(),
    getAdminTeamPerformance({ period: "30d" }),
    getAdminAuditLogs({ page: 1 })
  ]);
  const canUseQuickActions = admin?.role === "owner" || admin?.role === "manager";
  const canViewTeamPerformance = admin?.role === "owner" || admin?.role === "manager";

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

      {canViewTeamPerformance ? (
        <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] xl:gap-6">
          <Card className="p-4 shadow-none sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl font-bold text-oud-brown">الفريق</h2>
                <p className="mt-1 text-xs text-oud-muted">ملخص آخر 30 يوما</p>
              </div>
              <Link href="/admin/team/performance" className="text-xs font-semibold text-oud-brown">
                أداء الفريق
              </Link>
            </div>
            <dl className="mt-5 grid gap-3 sm:grid-cols-2">
              <DashboardMetric label="أعضاء نشطون" value={teamPerformance.kpis.activeTeamMembers.toString()} />
              <DashboardMetric label="سجلوا الدخول اليوم" value={teamPerformance.rows.filter((row) => isToday(row.last_sign_in_at)).length.toString()} />
              <DashboardMetric
                label="أفضل موظف بالمبيعات"
                value={teamPerformance.topPerformers.bySales[0]?.display_name || teamPerformance.topPerformers.bySales[0]?.full_name || "لا يوجد"}
              />
              <DashboardMetric
                label="أكثر موظف نشاطا"
                value={teamPerformance.topPerformers.byActivities[0]?.display_name || teamPerformance.topPerformers.byActivities[0]?.full_name || "لا يوجد"}
              />
              <DashboardMetric
                label="لم يسجلوا منذ 14 يوما"
                value={teamPerformance.rows.filter((row) => isInactiveFor14Days(row.last_sign_in_at)).length.toString()}
              />
              <DashboardMetric label="مبيعات منسوبة" value={<Price value={teamPerformance.kpis.completedSalesTotalOmr} />} />
            </dl>
          </Card>

          <Card className="p-4 shadow-none sm:p-5">
            <h2 className="font-display text-2xl font-bold text-oud-brown">آخر النشاطات</h2>
            <div className="mt-4 space-y-3">
              {activity.logs.slice(0, 8).length > 0 ? (
                activity.logs.slice(0, 8).map((log) => (
                  <div key={log.id} className="rounded-oud border border-oud-brown/10 bg-white p-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-semibold text-oud-brown">{log.admin_name ?? "إداري"}</p>
                      <Badge variant="soft">{getAuditActionLabel(log.action)}</Badge>
                    </div>
                    <p className="mt-1 text-sm leading-6 text-oud-muted">{log.description ?? "بدون وصف"}</p>
                    <p className="mt-1 text-xs text-oud-muted">{formatDateTime(log.created_at)}</p>
                  </div>
                ))
              ) : (
                <EmptyState title="لا توجد أنشطة" description="ستظهر أحدث سجلات الإدارة هنا." />
              )}
            </div>
          </Card>
        </div>
      ) : null}

      {analytics.alerts.length > 0 ? (
        <Card className="p-4 shadow-none sm:p-5">
          <h2 className="font-display text-2xl font-bold text-oud-brown">تنبيهات تحتاج متابعة</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {analytics.alerts.map((alert) => (
              <div key={alert.id} className="rounded-oud border border-red-900/15 bg-red-900/10 p-4">
                <p className="font-semibold text-red-900">{alert.label}</p>
                <p className="mt-2 text-2xl font-bold text-red-950">{alert.count}</p>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

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

function DashboardMetric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-oud bg-oud-beige/30 p-3">
      <dt className="text-xs text-oud-muted">{label}</dt>
      <dd className="mt-1 font-semibold text-oud-brown">{value}</dd>
    </div>
  );
}

function isToday(value: string | null) {
  if (!value) {
    return false;
  }

  return new Date(value).toISOString().slice(0, 10) === new Date().toISOString().slice(0, 10);
}

function isInactiveFor14Days(value: string | null) {
  if (!value) {
    return true;
  }

  return Date.now() - new Date(value).getTime() > 14 * 24 * 60 * 60 * 1000;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ar-OM", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

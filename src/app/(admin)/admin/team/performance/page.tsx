import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Badge, Card, EmptyState, Input, Price, Select } from "@/components/ui";
import { ADMIN_ROLES, adminRoleLabels } from "@/constants/admin-roles";
import { requireAdminRole } from "@/features/auth/queries";
import {
  getAdminTeamPerformance,
  type AdminPerformanceRow,
  type PerformancePeriod,
  type PerformanceSort
} from "@/features/admin-team/performance-queries";

const periodLabels: Record<PerformancePeriod, string> = {
  today: "اليوم",
  "7d": "آخر 7 أيام",
  "30d": "آخر 30 يوما",
  all: "كل الفترة"
};

const sortLabels: Record<PerformanceSort, string> = {
  sales: "المبيعات",
  orders: "الطلبات",
  activities: "الأنشطة",
  last_activity: "آخر نشاط"
};

export default async function TeamPerformancePage({
  searchParams
}: {
  searchParams: Promise<{
    period?: string;
    q?: string;
    role?: string;
    member_status?: string;
    sort?: string;
    include_owner?: string;
  }>;
}) {
  const admin = await requireAdminRole(["owner", "manager"]);

  if (!admin) {
    redirect("/admin?status=error&message=ليست لديك صلاحية لعرض أداء الفريق.");
  }

  const params = await searchParams;
  const performance = await getAdminTeamPerformance({
    period: params.period,
    search: params.q,
    role: params.role,
    status: params.member_status,
    sort: params.sort,
    includeOwner: params.include_owner
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <AdminPageHeader
          eyebrow="أداء الفريق"
          title="لوحة أداء الموظفين"
          description="إحصائيات منسوبة للإداريين من الطلبات المكتملة وسجل النشاط، مع منع تكرار الطلب الواحد في المبيعات."
        />
        <Link className="text-sm font-semibold text-oud-brown hover:text-oud-gold" href="/admin/team">
          العودة إلى الفريق
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <Kpi label="النشطون" value={performance.kpis.activeTeamMembers.toString()} />
        <Kpi label="الطلبات المنسوبة" value={performance.kpis.attributedOrders.toString()} />
        <Kpi label="الطلبات المكتملة" value={performance.kpis.completedOrders.toString()} />
        <Kpi label="إجمالي المبيعات" value={<Price value={performance.kpis.completedSalesTotalOmr} />} />
        <Kpi label="متوسط الطلب" value={<Price value={performance.kpis.averageOrderOmr} />} />
        <Kpi label="الأنشطة" value={performance.kpis.activityCount.toString()} />
      </div>

      <Card className="p-4 shadow-none">
        <form className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_12rem_12rem_12rem_12rem_auto] lg:items-end">
          <Input label="بحث بالاسم أو البريد" name="q" defaultValue={params.q ?? ""} />
          <Select label="الفترة" name="period" defaultValue={performance.period}>
            {Object.entries(periodLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </Select>
          <Select label="الدور" name="role" defaultValue={params.role ?? "all"}>
            <option value="all">كل الأدوار</option>
            {ADMIN_ROLES.map((role) => (
              <option key={role} value={role}>{adminRoleLabels[role]}</option>
            ))}
          </Select>
          <Select label="الحالة" name="member_status" defaultValue={params.member_status ?? "all"}>
            <option value="all">كل الحالات</option>
            <option value="active">نشط</option>
            <option value="inactive">معطل</option>
          </Select>
          <Select label="ترتيب حسب" name="sort" defaultValue={performance.sort}>
            {Object.entries(sortLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </Select>
          <button className="h-11 rounded-oud bg-oud-brown px-5 text-sm font-semibold text-oud-ivory" type="submit">
            تطبيق
          </button>
        </form>
      </Card>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-2xl font-bold text-oud-brown">أفضل أداء</h2>
          <Link
            href={`/admin/team/performance?include_owner=${params.include_owner === "true" ? "false" : "true"}`}
            className="text-xs font-semibold text-oud-brown hover:text-oud-gold"
          >
            {params.include_owner === "true" ? "استبعاد المالك" : "تضمين المالك"}
          </Link>
        </div>
        <div className="grid gap-4 xl:grid-cols-3">
          <TopList title="حسب المبيعات" rows={performance.topPerformers.bySales} metric="sales" />
          <TopList title="حسب الطلبات المكتملة" rows={performance.topPerformers.byCompletedOrders} metric="completed" />
          <TopList title="حسب الأنشطة" rows={performance.topPerformers.byActivities} metric="activity" />
        </div>
      </section>

      <PerformanceTable rows={performance.rows} />
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Card className="p-4 shadow-none">
      <p className="text-xs font-semibold text-oud-muted">{label}</p>
      <div className="mt-3 text-xl font-bold text-oud-brown">{value}</div>
    </Card>
  );
}

function TopList({
  title,
  rows,
  metric
}: {
  title: string;
  rows: AdminPerformanceRow[];
  metric: "sales" | "completed" | "activity";
}) {
  return (
    <Card className="p-4 shadow-none">
      <h3 className="font-display text-xl font-bold text-oud-brown">{title}</h3>
      <div className="mt-4 space-y-3">
        {rows.length > 0 ? (
          rows.map((row, index) => (
            <div key={row.admin_id} className="flex items-center justify-between gap-3 rounded-oud bg-white p-3">
              <div className="min-w-0">
                <p className="truncate font-semibold text-oud-brown">
                  {index + 1}. {row.display_name || row.full_name}
                </p>
                <p className="text-xs text-oud-muted">{adminRoleLabels[row.role]}</p>
              </div>
              <div className="shrink-0 text-sm font-bold text-oud-brown">
                {metric === "sales" ? (
                  <Price value={row.completed_sales_total_omr} />
                ) : metric === "completed" ? (
                  `${row.completed_sales_count} طلب`
                ) : (
                  `${row.total_activity_count} نشاط`
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-oud-muted">لا توجد بيانات كافية.</p>
        )}
      </div>
    </Card>
  );
}

function PerformanceTable({ rows }: { rows: AdminPerformanceRow[] }) {
  if (rows.length === 0) {
    return (
      <EmptyState
        title="لا توجد بيانات أداء"
        description="ستظهر الإحصائيات عندما توجد طلبات أو أنشطة ضمن الفترة المحددة."
      />
    );
  }

  return (
    <Card className="overflow-hidden shadow-none">
      <div className="hidden overflow-x-auto xl:block">
        <table className="w-full min-w-[78rem] text-right text-sm">
          <thead className="bg-oud-beige/35 text-xs text-oud-muted">
            <tr>
              <th className="px-5 py-3 font-semibold">الإداري</th>
              <th className="px-5 py-3 font-semibold">الحالة</th>
              <th className="px-5 py-3 font-semibold">آخر دخول</th>
              <th className="px-5 py-3 font-semibold">الطلبات</th>
              <th className="px-5 py-3 font-semibold">مكتملة</th>
              <th className="px-5 py-3 font-semibold">ملغاة</th>
              <th className="px-5 py-3 font-semibold">المبيعات</th>
              <th className="px-5 py-3 font-semibold">المتوسط</th>
              <th className="px-5 py-3 font-semibold">الأنشطة</th>
              <th className="px-5 py-3 font-semibold">آخر نشاط</th>
              <th className="px-5 py-3 font-semibold">الملف</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-oud-brown/10">
            {rows.map((row) => (
              <tr key={row.admin_id} className="bg-oud-pearl align-top">
                <td className="px-5 py-4">
                  <p className="font-bold text-oud-brown">{row.display_name || row.full_name}</p>
                  <p className="text-xs text-oud-muted">{adminRoleLabels[row.role]}</p>
                </td>
                <td className="px-5 py-4"><StatusBadge active={row.is_active} /></td>
                <td className="px-5 py-4 text-oud-muted">{formatDateTime(row.last_sign_in_at, "لم يسجل الدخول بعد")}</td>
                <td className="px-5 py-4 text-oud-muted">{row.attributed_orders_count}</td>
                <td className="px-5 py-4 text-oud-muted">{row.completed_sales_count}</td>
                <td className="px-5 py-4 text-oud-muted">{row.orders_cancelled_count}</td>
                <td className="px-5 py-4"><Price value={row.completed_sales_total_omr} /></td>
                <td className="px-5 py-4"><Price value={row.average_completed_order_omr} /></td>
                <td className="px-5 py-4 text-oud-muted">{row.total_activity_count}</td>
                <td className="px-5 py-4 text-oud-muted">{formatDateTime(row.last_activity_at, "لا يوجد")}</td>
                <td className="px-5 py-4">
                  <Link href={`/admin/team/${row.admin_id}`} className="text-sm font-semibold text-oud-brown hover:text-oud-gold">
                    عرض الملف
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 p-3 xl:hidden">
        {rows.map((row) => (
          <div key={row.admin_id} className="rounded-oud border border-oud-brown/10 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-bold text-oud-brown">{row.display_name || row.full_name}</p>
                <p className="text-xs text-oud-muted">{adminRoleLabels[row.role]}</p>
              </div>
              <StatusBadge active={row.is_active} />
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <Metric label="الطلبات" value={row.attributed_orders_count.toString()} />
              <Metric label="مكتملة" value={row.completed_sales_count.toString()} />
              <Metric label="ملغاة" value={row.orders_cancelled_count.toString()} />
              <Metric label="الأنشطة" value={row.total_activity_count.toString()} />
              <Metric label="المبيعات" value={<Price value={row.completed_sales_total_omr} />} />
              <Metric label="المتوسط" value={<Price value={row.average_completed_order_omr} />} />
            </dl>
            <Link href={`/admin/team/${row.admin_id}`} className="mt-4 inline-flex text-sm font-semibold text-oud-brown">
              عرض الملف
            </Link>
          </div>
        ))}
      </div>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-oud bg-oud-beige/30 p-3">
      <dt className="text-xs text-oud-muted">{label}</dt>
      <dd className="mt-1 font-semibold text-oud-brown">{value}</dd>
    </div>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return <Badge variant={active ? "success" : "danger"}>{active ? "نشط" : "معطل"}</Badge>;
}

function formatDateTime(value: string | null, empty: string) {
  if (!value) {
    return empty;
  }

  return new Intl.DateTimeFormat("ar-OM", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { TeamMemberActions } from "@/components/admin/team-member-actions";
import { TeamMemberForm } from "@/components/admin/team-member-form";
import { Badge, Card, EmptyState, Price } from "@/components/ui";
import { adminRoleLabels } from "@/constants/admin-roles";
import { getAuditActionLabel } from "@/features/admin-audit/labels";
import { getAdminPerformanceProfile } from "@/features/admin-team/performance-queries";
import { requireAdmin } from "@/features/auth/queries";
import { getTeamMemberProfile } from "@/features/team/queries";

const attributionLabels = {
  created: "أنشأ",
  updated: "حدّث",
  confirmed: "أكد",
  completed: "أكمل",
  cancelled: "ألغى"
};

const statusLabels = {
  pending: "قيد التأكيد",
  confirmed: "مؤكد",
  preparing: "قيد التجهيز",
  out_for_delivery: "خرج للتوصيل",
  completed: "مكتمل",
  cancelled: "ملغي"
};

export default async function TeamMemberProfilePage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string; message?: string }>;
}) {
  const admin = await requireAdmin();

  if (!admin) {
    redirect("/admin/login");
  }

  const [{ id }, urlParams] = await Promise.all([params, searchParams]);
  const [member, performanceProfile] = await Promise.all([
    getTeamMemberProfile(id),
    getAdminPerformanceProfile(id)
  ]);

  if (!member) {
    notFound();
  }

  const canManage = admin.role === "owner";
  const performance = performanceProfile?.performance;
  const recentOrders = performanceProfile?.recentOrders ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <AdminPageHeader
          eyebrow="ملف إداري"
          title={member.display_name || member.full_name}
          description="تفاصيل الحساب، الصلاحيات، الأداء، آخر الطلبات المنسوبة، وأحدث الأنشطة."
        />
        <Link className="text-sm font-semibold text-oud-brown hover:text-oud-gold" href={canManage ? "/admin/team" : "/admin"}>
          {canManage ? "العودة إلى الفريق" : "العودة إلى اللوحة"}
        </Link>
      </div>

      <StatusMessage status={urlParams.status} message={urlParams.message} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-4">
          <Card className="p-4 shadow-none sm:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm text-oud-muted" dir="ltr">{member.email}</p>
                <h2 className="mt-1 font-display text-2xl font-bold text-oud-brown">{member.full_name}</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant="gold">{adminRoleLabels[member.role]}</Badge>
                  <Badge variant={member.is_active ? "success" : "danger"}>{member.is_active ? "نشط" : "معطل"}</Badge>
                  {member.must_change_password ? <Badge variant="soft">يلزم تغيير كلمة المرور</Badge> : null}
                </div>
              </div>
              {canManage ? (
                <TeamMemberActions
                  memberId={member.id}
                  isActive={member.is_active}
                  isSelf={member.id === admin.id}
                  isOwner={member.role === "owner"}
                  showProfile={false}
                />
              ) : null}
            </div>

            <dl className="mt-6 grid gap-4 text-sm md:grid-cols-3">
              <Info label="الهاتف" value={member.phone ?? "-"} dir="ltr" />
              <Info label="آخر دخول" value={formatDateTime(member.last_sign_in_at, "لم يسجل الدخول بعد")} />
              <Info label="تاريخ الإنشاء" value={formatDateTime(member.created_at, "-")} />
              <Info label="أنشأ الحساب" value={member.creator_name ?? "-"} />
              <Info label="عدد الأنشطة" value={String(member.activity_count)} />
              <Info label="الطلبات/المبيعات" value={`${member.order_count} طلب - ${member.sales_total_omr.toFixed(3)} ر.ع`} />
            </dl>
          </Card>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <MetricCard label="إجمالي المبيعات" value={<Price value={performance?.completed_sales_total_omr ?? 0} />} />
            <MetricCard label="الطلبات المكتملة" value={(performance?.completed_sales_count ?? 0).toString()} />
            <MetricCard label="متوسط قيمة الطلب" value={<Price value={performance?.average_completed_order_omr ?? 0} />} />
            <MetricCard label="الطلبات الملغاة" value={(performance?.orders_cancelled_count ?? 0).toString()} />
            <MetricCard label="عدد الأنشطة" value={(performance?.total_activity_count ?? 0).toString()} />
            <MetricCard label="آخر نشاط" value={formatDateTime(performance?.last_activity_at ?? null, "لا يوجد")} />
          </div>

          <Card className="overflow-hidden shadow-none">
            <div className="border-b border-oud-brown/10 p-5">
              <h2 className="font-display text-xl font-bold text-oud-brown">أحدث الطلبات المنسوبة</h2>
              <p className="mt-1 text-xs text-oud-muted">تعرض أعلى نسبة ذات معنى عند ارتباط الطلب بأكثر من حقل.</p>
            </div>
            {recentOrders.length === 0 ? (
              <div className="p-5">
                <EmptyState title="لا توجد طلبات منسوبة" description="ستظهر آخر الطلبات المرتبطة بهذا الإداري هنا." />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[44rem] text-right text-sm">
                  <thead className="bg-oud-beige/35 text-xs text-oud-muted">
                    <tr>
                      <th className="px-5 py-3 font-semibold">رقم الطلب</th>
                      <th className="px-5 py-3 font-semibold">الحالة</th>
                      <th className="px-5 py-3 font-semibold">القيمة</th>
                      <th className="px-5 py-3 font-semibold">تاريخ الطلب</th>
                      <th className="px-5 py-3 font-semibold">نوع النسبة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-oud-brown/10">
                    {recentOrders.map((order) => (
                      <tr key={order.id} className="bg-oud-pearl">
                        <td className="px-5 py-4 font-semibold text-oud-brown" dir="ltr">
                          <Link href={`/admin/orders/${order.id}`}>{order.order_number}</Link>
                        </td>
                        <td className="px-5 py-4">
                          <Badge variant={order.status === "cancelled" ? "danger" : "gold"}>{statusLabels[order.status]}</Badge>
                        </td>
                        <td className="px-5 py-4"><Price value={order.total_omr} /></td>
                        <td className="px-5 py-4 text-oud-muted">{formatDateTime(order.created_at, "-")}</td>
                        <td className="px-5 py-4 text-oud-muted">{attributionLabels[order.attribution_type]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {canManage ? <TeamMemberForm member={member} /> : null}
        </div>

        <Card className="p-4 shadow-none sm:p-5">
          <h2 className="font-display text-xl font-bold text-oud-brown">أحدث 20 نشاطا</h2>
          <div className="mt-4 space-y-3">
            {member.latest_activities.length > 0 ? (
              member.latest_activities.map((activity) => (
                <div key={activity.id} className="rounded-oud border border-oud-brown/10 bg-white p-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold text-oud-brown">{getAuditActionLabel(activity.action)}</p>
                    <span className="text-xs text-oud-muted">{formatDateTime(activity.created_at, "-")}</span>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-oud-muted">{activity.description ?? activity.entity_type}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-oud-muted">لا توجد أنشطة مسجلة بعد.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Info({ label, value, dir }: { label: string; value: string; dir?: "ltr" | "rtl" }) {
  return (
    <div className="rounded-oud bg-oud-beige/30 p-3">
      <dt className="text-xs text-oud-muted">{label}</dt>
      <dd className="mt-1 font-semibold text-oud-brown" dir={dir}>{value}</dd>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Card className="p-4 shadow-none">
      <p className="text-xs font-semibold text-oud-muted">{label}</p>
      <div className="mt-3 text-lg font-bold text-oud-brown">{value}</div>
    </Card>
  );
}

function StatusMessage({ status, message }: { status?: string; message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <div
      className={
        status === "error"
          ? "rounded-oud border border-red-900/15 bg-red-900/10 px-4 py-3 text-sm font-semibold text-red-900"
          : "rounded-oud border border-green-900/15 bg-green-900/10 px-4 py-3 text-sm font-semibold text-green-900"
      }
    >
      {message}
    </div>
  );
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

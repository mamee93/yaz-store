import Link from "next/link";
import { Eye, Filter, RotateCcw } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Badge, Button, Card, EmptyState, Input, Price, Select } from "@/components/ui";
import {
  getReturnStatusVariant,
  returnStatusLabels,
  returnTypeLabels
} from "@/features/returns/labels";
import { getAdminReturns, type AdminReturnFilters } from "@/features/returns/queries";

type AdminReturnsPageProps = {
  searchParams: Promise<AdminReturnFilters & { status?: string; message?: string }>;
};

export default async function AdminReturnsPage({ searchParams }: AdminReturnsPageProps) {
  const params = await searchParams;
  const filters = normalizeFilters(params);
  const { returns, kpis } = await getAdminReturns(filters);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="المرتجعات"
        title="المرتجعات والاسترداد"
        description="مراجعة طلبات الإرجاع والاستبدال وتسجيل الاستلام والاسترداد اليدوي."
      />
      <StatusMessage status={params.status} message={params.message} />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <Kpi label="طلبات جديدة" value={kpis.requested} />
        <Kpi label="بانتظار المراجعة" value={kpis.pendingReview} />
        <Kpi label="معتمدة" value={kpis.approved} />
        <Kpi label="مستلمة" value={kpis.received} />
        <Kpi label="مستردة" value={kpis.refunded} />
        <Kpi label="مرفوضة" value={kpis.rejected} />
      </div>

      <Card className="p-4 shadow-none sm:p-5">
        <form className="grid gap-4 lg:grid-cols-[minmax(12rem,1.4fr)_repeat(4,minmax(9rem,1fr))_auto] lg:items-end">
          <Input
            label="بحث"
            name="q"
            defaultValue={filters.q ?? ""}
            placeholder="رقم الطلب أو العميل أو رقم المرتجع"
          />
          <Select label="الحالة" name="status" defaultValue={filters.status ?? "all"}>
            <option value="all">كل الحالات</option>
            {Object.entries(returnStatusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <Select label="النوع" name="return_type" defaultValue={filters.return_type ?? "all"}>
            <option value="all">كل الأنواع</option>
            {Object.entries(returnTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <Input label="من" name="date_from" type="date" defaultValue={filters.date_from ?? ""} />
          <Input label="إلى" name="date_to" type="date" defaultValue={filters.date_to ?? ""} />
          <div className="flex gap-2">
            <Button type="submit" leftIcon={<Filter className="size-4" />} className="flex-1 lg:flex-none">
              تطبيق
            </Button>
            <Link
              href="/admin/returns"
              className="inline-flex h-11 items-center justify-center rounded-oud border border-oud-brown/20 bg-oud-pearl px-4 text-sm font-semibold text-oud-brown transition hover:bg-oud-beige/45"
            >
              <RotateCcw className="size-4" aria-label="إعادة ضبط" />
            </Link>
          </div>
        </form>
      </Card>

      {returns.length > 0 ? (
        <Card className="overflow-hidden shadow-none">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[58rem] text-right text-sm">
              <thead className="bg-oud-beige/35 text-xs text-oud-muted">
                <tr>
                  <th className="px-5 py-3 font-semibold">رقم المرتجع</th>
                  <th className="px-5 py-3 font-semibold">رقم الطلب</th>
                  <th className="px-5 py-3 font-semibold">العميل</th>
                  <th className="px-5 py-3 font-semibold">النوع</th>
                  <th className="px-5 py-3 font-semibold">الحالة</th>
                  <th className="px-5 py-3 font-semibold">المبلغ</th>
                  <th className="px-5 py-3 font-semibold">التاريخ</th>
                  <th className="px-5 py-3 font-semibold">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-oud-brown/10">
                {returns.map((item) => (
                  <tr key={item.id} className="bg-oud-pearl align-top">
                    <td className="px-5 py-4 font-semibold text-oud-brown" dir="ltr">
                      {item.id.slice(0, 8)}
                    </td>
                    <td className="px-5 py-4" dir="ltr">{item.order_number}</td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-oud-ink">{item.customer_name}</p>
                      <p className="mt-1 text-xs text-oud-muted" dir="ltr">{item.customer_phone}</p>
                    </td>
                    <td className="px-5 py-4">{returnTypeLabels[item.return_type]}</td>
                    <td className="px-5 py-4">
                      <Badge variant={getReturnStatusVariant(item.status)}>
                        {returnStatusLabels[item.status]}
                      </Badge>
                    </td>
                    <td className="px-5 py-4"><Price value={item.expected_refund_omr} /></td>
                    <td className="px-5 py-4 text-xs text-oud-muted">{formatDate(item.requested_at)}</td>
                    <td className="px-5 py-4">
                      <Link
                        href={`/admin/returns/${item.id}`}
                        className="inline-flex items-center gap-2 text-xs font-semibold text-oud-brown"
                      >
                        <Eye className="size-4" aria-hidden="true" />
                        التفاصيل
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <EmptyState title="لا توجد مرتجعات" description="لا توجد طلبات إرجاع مطابقة للفلاتر الحالية." />
      )}
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-4 shadow-none">
      <p className="text-xs font-semibold text-oud-muted">{label}</p>
      <p className="mt-2 text-2xl font-bold text-oud-brown">{value}</p>
    </Card>
  );
}

function normalizeFilters(params: AdminReturnFilters): AdminReturnFilters {
  return {
    q: cleanParam(params.q),
    status: cleanParam(params.status) ?? "all",
    return_type: cleanParam(params.return_type) ?? "all",
    date_from: cleanParam(params.date_from),
    date_to: cleanParam(params.date_to)
  };
}

function cleanParam(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
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

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ar-OM", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

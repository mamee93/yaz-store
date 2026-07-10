import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Badge, Card, Input, Select } from "@/components/ui";
import { adminRoleLabels, normalizeAdminRole } from "@/constants/admin-roles";
import { getAuditActionLabel } from "@/features/admin-audit/labels";
import { getAdminAuditLogs, getAuditFilterOptions } from "@/features/admin-audit/queries";
import { requireAdminRole } from "@/features/auth/queries";
import type { Json } from "@/types/database";

export default async function AdminActivityPage({
  searchParams
}: {
  searchParams: Promise<{
    q?: string;
    admin_id?: string;
    action?: string;
    date?: string;
    page?: string;
  }>;
}) {
  const admin = await requireAdminRole(["owner", "manager"]);

  if (!admin) {
    redirect("/admin?status=error&message=ليست لديك صلاحية لعرض سجل النشاط.");
  }

  const params = await searchParams;
  const page = Number(params.page ?? "1");
  const [{ logs, count, pageSize }, options] = await Promise.all([
    getAdminAuditLogs({
      search: params.q,
      adminId: params.admin_id,
      action: params.action,
      date: params.date,
      page: Number.isFinite(page) ? page : 1
    }),
    getAuditFilterOptions()
  ]);
  const totalPages = Math.max(Math.ceil(count / pageSize), 1);
  const currentPage = Math.min(Math.max(page || 1, 1), totalPages);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="سجل النشاط"
        title="متابعة عمليات الإدارة"
        description="اعرض عمليات الفريق المهمة مع البحث والتصفية حسب الإداري أو نوع العملية أو التاريخ."
      />

      <Card className="p-4 shadow-none">
        <form className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_14rem_14rem_12rem_auto] lg:items-end">
          <Input label="بحث" name="q" defaultValue={params.q ?? ""} />
          <Select label="الإداري" name="admin_id" defaultValue={params.admin_id ?? "all"}>
            <option value="all">كل الإداريين</option>
            {options.admins.map((option) => (
              <option key={option.id} value={option.id}>
                {option.display_name || option.full_name || option.email}
              </option>
            ))}
          </Select>
          <Select label="العملية" name="action" defaultValue={params.action ?? "all"}>
            <option value="all">كل العمليات</option>
            {options.actions.map((action) => (
              <option key={action} value={action}>{getAuditActionLabel(action)}</option>
            ))}
          </Select>
          <Input label="التاريخ" name="date" type="date" defaultValue={params.date ?? ""} />
          <button className="h-11 rounded-oud bg-oud-brown px-5 text-sm font-semibold text-oud-ivory" type="submit">
            تطبيق
          </button>
        </form>
      </Card>

      <Card className="overflow-hidden shadow-none">
        <div className="divide-y divide-oud-brown/10">
          {logs.length > 0 ? (
            logs.map((log) => (
              <article key={log.id} className="grid gap-3 bg-oud-pearl p-4 md:grid-cols-[12rem_minmax(0,1fr)_10rem] md:p-5">
                <div>
                  <p className="font-bold text-oud-brown">{log.admin_name ?? "إداري محذوف"}</p>
                  <p className="text-xs text-oud-muted">
                    {log.admin_role ? adminRoleLabels[normalizeAdminRole(log.admin_role)] : "-"}
                  </p>
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="gold">{getAuditActionLabel(log.action)}</Badge>
                    <Badge variant="soft">{log.entity_type}</Badge>
                  </div>
                  <p className="mt-2 text-sm leading-7 text-oud-muted">{log.description ?? "بدون وصف"}</p>
                  <MetadataSummary metadata={log.metadata} />
                </div>
                <time className="text-sm text-oud-muted">{formatDateTime(log.created_at)}</time>
              </article>
            ))
          ) : (
            <p className="p-6 text-sm text-oud-muted">لا توجد أنشطة مطابقة للفلاتر الحالية.</p>
          )}
        </div>
      </Card>

      <div className="flex items-center justify-between gap-3">
        <PaginationLink disabled={currentPage <= 1} page={currentPage - 1} params={params}>
          السابق
        </PaginationLink>
        <span className="text-sm font-semibold text-oud-muted">
          صفحة {currentPage} من {totalPages}
        </span>
        <PaginationLink disabled={currentPage >= totalPages} page={currentPage + 1} params={params}>
          التالي
        </PaginationLink>
      </div>
    </div>
  );
}

function MetadataSummary({ metadata }: { metadata: Json }) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }

  const entries = Object.entries(metadata).slice(0, 4);

  if (entries.length === 0) {
    return null;
  }

  return (
    <dl className="mt-3 flex flex-wrap gap-2 text-xs text-oud-muted">
      {entries.map(([key, value]) => (
        <div key={key} className="rounded-full bg-oud-beige/45 px-2.5 py-1">
          <dt className="inline font-semibold text-oud-brown">{key}: </dt>
          <dd className="inline">{String(value)}</dd>
        </div>
      ))}
    </dl>
  );
}

function PaginationLink({
  disabled,
  page,
  params,
  children
}: {
  disabled: boolean;
  page: number;
  params: Record<string, string | undefined>;
  children: React.ReactNode;
}) {
  const nextParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value && key !== "page") {
      nextParams.set(key, value);
    }
  }
  nextParams.set("page", String(page));

  if (disabled) {
    return (
      <span className="inline-flex h-10 items-center rounded-oud border border-oud-brown/10 bg-oud-beige/30 px-4 text-sm font-semibold text-oud-muted">
        {children}
      </span>
    );
  }

  return (
    <Link
      href={`/admin/activity?${nextParams.toString()}`}
      className="inline-flex h-10 items-center rounded-oud border border-oud-brown/10 bg-white px-4 text-sm font-semibold text-oud-brown hover:bg-oud-beige/35"
    >
      {children}
    </Link>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ar-OM", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

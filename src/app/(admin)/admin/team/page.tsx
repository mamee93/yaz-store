import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { TeamMembersTable } from "@/components/admin/team-members-table";
import { Badge, Card, Input, Select } from "@/components/ui";
import { ADMIN_ROLES, adminRoleLabels } from "@/constants/admin-roles";
import { requireAdminRole } from "@/features/auth/queries";
import { getTeamMembers } from "@/features/team/queries";

export default async function AdminTeamPage({
  searchParams
}: {
  searchParams: Promise<{
    status?: string;
    message?: string;
    q?: string;
    role?: string;
    member_status?: string;
  }>;
}) {
  const owner = await requireAdminRole(["owner"]);

  if (!owner) {
    redirect("/admin?status=error&message=ليست لديك صلاحية لإدارة الفريق.");
  }

  const params = await searchParams;
  const members = await getTeamMembers({
    search: params.q,
    role: params.role,
    status: params.member_status
  });
  const stats = buildStats(members);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <AdminPageHeader
          eyebrow="الفريق والصلاحيات"
          title="إدارة فريق العمل"
          description="أنشئ حسابا مستقلا لكل إداري، وحدد صلاحياته، وتابع نشاطه داخل لوحة الإدارة."
        />
        <Link
          href="/admin/team/new"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-oud bg-oud-brown px-5 text-sm font-semibold text-oud-ivory shadow-soft transition hover:bg-oud-coffee"
        >
          <Plus className="size-4" aria-hidden="true" />
          إضافة عضو
        </Link>
      </div>

      <StatusMessage status={params.status} message={params.message} />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="أعضاء الفريق" value={stats.total} />
        <StatCard label="النشطون" value={stats.active} tone="success" />
        <StatCard label="الموقوفون" value={stats.inactive} tone="danger" />
        <StatCard label="المالكون والمديرون" value={stats.leaders} />
      </div>

      <Card className="p-4 shadow-none">
        <form className="grid gap-3 md:grid-cols-[minmax(0,1fr)_14rem_14rem_auto] md:items-end">
          <Input label="بحث بالاسم أو البريد" name="q" defaultValue={params.q ?? ""} />
          <Select label="الدور" name="role" defaultValue={params.role ?? "all"}>
            <option value="all">كل الأدوار</option>
            {ADMIN_ROLES.map((role) => (
              <option key={role} value={role}>
                {adminRoleLabels[role]}
              </option>
            ))}
          </Select>
          <Select label="الحالة" name="member_status" defaultValue={params.member_status ?? "all"}>
            <option value="all">كل الحالات</option>
            <option value="active">نشط</option>
            <option value="inactive">معطل</option>
          </Select>
          <button className="h-11 rounded-oud bg-oud-brown px-5 text-sm font-semibold text-oud-ivory" type="submit">
            تطبيق
          </button>
        </form>
      </Card>

      <TeamMembersTable members={members} currentAdminId={owner.id} />
    </div>
  );
}

function StatCard({
  label,
  value,
  tone = "default"
}: {
  label: string;
  value: number;
  tone?: "default" | "success" | "danger";
}) {
  const variant = tone === "success" ? "success" : tone === "danger" ? "danger" : "gold";

  return (
    <Card className="p-4 shadow-none">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-oud-muted">{label}</p>
        <Badge variant={variant}>{value}</Badge>
      </div>
      <p className="mt-3 font-display text-3xl font-bold text-oud-brown">{value}</p>
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

function buildStats(members: Awaited<ReturnType<typeof getTeamMembers>>) {
  return {
    total: members.length,
    active: members.filter((member) => member.is_active).length,
    inactive: members.filter((member) => !member.is_active).length,
    leaders: members.filter((member) => member.role === "owner" || member.role === "manager").length
  };
}

import { redirect } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { TeamMemberForm } from "@/components/admin/team-member-form";
import { TeamMembersTable } from "@/components/admin/team-members-table";
import { Card } from "@/components/ui";
import {
  ADMIN_ROLES,
  adminRoleDescriptions,
  adminRoleLabels
} from "@/constants/admin-roles";
import { requireAdminRole } from "@/features/auth/queries";
import { getTeamMembers } from "@/features/team/queries";

export default async function AdminTeamPage({
  searchParams
}: {
  searchParams: Promise<{ status?: string; message?: string }>;
}) {
  const owner = await requireAdminRole(["owner"]);

  if (!owner) {
    redirect("/admin?status=error&message=ليست لديك صلاحية لإدارة الفريق.");
  }

  const [members, params] = await Promise.all([getTeamMembers(), searchParams]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="الفريق والصلاحيات"
        title="إدارة فريق العمل"
        description="تحكم في صلاحيات الموظفين الذين يساعدون في تشغيل المتجر ومعالجة الطلبات."
      />

      <StatusMessage status={params.status} message={params.message} />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-5">
          <TeamMembersTable members={members} currentAdminId={owner.id} />
        </div>
        <aside className="space-y-5 xl:sticky xl:top-24">
          <TeamMemberForm />
          <Card className="p-4 shadow-none sm:p-5">
            <h2 className="font-display text-xl font-bold text-oud-brown">ملخص الصلاحيات</h2>
            <div className="mt-4 space-y-3 text-sm leading-7 text-oud-muted">
              {ADMIN_ROLES.map((role) => (
                <p key={role}>
                  <span className="font-bold text-oud-brown">{adminRoleLabels[role]}:</span>{" "}
                  {adminRoleDescriptions[role]}
                </p>
              ))}
            </div>
          </Card>
        </aside>
      </div>
    </div>
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

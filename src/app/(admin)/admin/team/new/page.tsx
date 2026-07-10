import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { TeamMemberForm } from "@/components/admin/team-member-form";
import { requireAdminRole } from "@/features/auth/queries";

export default async function NewTeamMemberPage({
  searchParams
}: {
  searchParams: Promise<{ status?: string; message?: string }>;
}) {
  const owner = await requireAdminRole(["owner"]);

  if (!owner) {
    redirect("/admin?status=error&message=ليست لديك صلاحية لإدارة الفريق.");
  }

  const params = await searchParams;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <AdminPageHeader
          eyebrow="عضو جديد"
          title="إضافة عضو إلى الفريق"
          description="أنشئ حساب دخول مستقل للموظف باستخدام بريد وكلمة مرور مؤقتة، ثم حدّد دوره وحالة الحساب."
        />
        <Link className="text-sm font-semibold text-oud-brown hover:text-oud-gold" href="/admin/team">
          العودة إلى الفريق
        </Link>
      </div>
      <StatusMessage status={params.status} message={params.message} />
      <TeamMemberForm />
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

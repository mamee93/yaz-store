import { Badge, Button, Card, EmptyState, Select } from "@/components/ui";
import { ADMIN_ROLES, adminRoleLabels } from "@/constants/admin-roles";
import { updateTeamMemberRoleAction } from "@/features/team/actions";
import type { TeamMember } from "@/features/team/queries";
import { TeamMemberActions } from "./team-member-actions";

type TeamMembersTableProps = {
  members: TeamMember[];
  currentAdminId: string;
};

export function TeamMembersTable({ members, currentAdminId }: TeamMembersTableProps) {
  if (members.length === 0) {
    return (
      <EmptyState
        title="لا يوجد أعضاء مطابقون"
        description="جرّب تعديل البحث أو الفلاتر، أو أضف عضوا جديدا للفريق."
      />
    );
  }

  return (
    <Card className="overflow-hidden shadow-none">
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[72rem] text-right text-sm">
          <thead className="bg-oud-beige/35 text-xs text-oud-muted">
            <tr>
              <th className="px-5 py-3 font-semibold">العضو</th>
              <th className="px-5 py-3 font-semibold">الهاتف</th>
              <th className="px-5 py-3 font-semibold">الدور</th>
              <th className="px-5 py-3 font-semibold">الحالة</th>
              <th className="px-5 py-3 font-semibold">آخر دخول</th>
              <th className="px-5 py-3 font-semibold">النشاط</th>
              <th className="px-5 py-3 font-semibold">الطلبات/المبيعات</th>
              <th className="px-5 py-3 font-semibold">إجراء</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-oud-brown/10">
            {members.map((member) => (
              <tr key={member.id} className="bg-oud-pearl align-top">
                <td className="px-5 py-4">
                  <p className="font-bold text-oud-brown">{member.display_name || member.full_name}</p>
                  <p className="text-xs text-oud-muted" dir="ltr">{member.email}</p>
                  <p className="mt-1 text-xs text-oud-muted">أضيف في {formatDate(member.created_at)}</p>
                </td>
                <td className="px-5 py-4 text-oud-muted" dir="ltr">{member.phone ?? "-"}</td>
                <td className="px-5 py-4">
                  <form action={updateTeamMemberRoleAction.bind(null, member.id)} className="flex min-w-56 items-end gap-2">
                    <Select name="role" defaultValue={member.role} aria-label="الدور" disabled={member.role === "owner"}>
                      {ADMIN_ROLES.filter((role) => role !== "owner" || member.role === "owner").map((role) => (
                        <option key={role} value={role}>
                          {adminRoleLabels[role]}
                        </option>
                      ))}
                    </Select>
                    <Button type="submit" size="sm" disabled={member.role === "owner"}>
                      حفظ
                    </Button>
                  </form>
                </td>
                <td className="px-5 py-4">
                  <StatusBadge active={member.is_active} />
                </td>
                <td className="px-5 py-4 text-oud-muted">{formatDateTime(member.last_sign_in_at)}</td>
                <td className="px-5 py-4 text-oud-muted">{member.activity_count}</td>
                <td className="px-5 py-4 text-oud-muted">
                  <span className="block">{member.order_count} طلب</span>
                  <span className="block">{member.sales_total_omr.toFixed(3)} ر.ع</span>
                </td>
                <td className="px-5 py-4">
                  <TeamMemberActions
                    memberId={member.id}
                    isActive={member.is_active}
                    isSelf={member.id === currentAdminId}
                    isOwner={member.role === "owner"}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 p-3 lg:hidden">
        {members.map((member) => (
          <div key={member.id} className="rounded-oud border border-oud-brown/10 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-bold text-oud-brown">{member.display_name || member.full_name}</p>
                <p className="truncate text-xs text-oud-muted" dir="ltr">{member.email}</p>
              </div>
              <StatusBadge active={member.is_active} />
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm text-oud-muted">
              <div>
                <dt className="text-xs">الدور</dt>
                <dd className="font-semibold text-oud-brown">{adminRoleLabels[member.role]}</dd>
              </div>
              <div>
                <dt className="text-xs">الهاتف</dt>
                <dd dir="ltr">{member.phone ?? "-"}</dd>
              </div>
              <div>
                <dt className="text-xs">النشاط</dt>
                <dd>{member.activity_count}</dd>
              </div>
              <div>
                <dt className="text-xs">الطلبات</dt>
                <dd>{member.order_count}</dd>
              </div>
            </dl>
            <div className="mt-4">
              <TeamMemberActions
                memberId={member.id}
                isActive={member.is_active}
                isSelf={member.id === currentAdminId}
                isOwner={member.role === "owner"}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return <Badge variant={active ? "success" : "danger"}>{active ? "نشط" : "معطل"}</Badge>;
}

function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("ar-OM", {
    dateStyle: "medium"
  }).format(new Date(value));
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "لم يسجل بعد";
  }

  return new Intl.DateTimeFormat("ar-OM", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

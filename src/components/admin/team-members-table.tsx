import { Button, Card, EmptyState, Select } from "@/components/ui";
import {
  ADMIN_ROLES,
  adminRoleLabels,
  type AdminRole
} from "@/constants/admin-roles";
import { updateTeamMemberAction } from "@/features/team/actions";
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
        title="لا يوجد أعضاء فريق"
        description="أضف أول عضو فريق لمساعدة الإدارة في معالجة الطلبات."
      />
    );
  }

  return (
    <Card className="overflow-hidden shadow-none">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[58rem] text-right text-sm">
          <thead className="bg-oud-beige/35 text-xs text-oud-muted">
            <tr>
              <th className="px-5 py-3 font-semibold">البريد</th>
              <th className="px-5 py-3 font-semibold">الاسم</th>
              <th className="px-5 py-3 font-semibold">الدور</th>
              <th className="px-5 py-3 font-semibold">الحالة</th>
              <th className="px-5 py-3 font-semibold">تاريخ الإضافة</th>
              <th className="px-5 py-3 font-semibold">آخر تحديث</th>
              <th className="px-5 py-3 font-semibold">إجراء</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-oud-brown/10">
            {members.map((member) => {
              const updateAction = updateTeamMemberAction.bind(null, member.id);
              const displayName = member.display_name ?? member.full_name ?? "-";
              const isSelf = member.id === currentAdminId;

              return (
                <tr key={member.id} className="bg-oud-pearl align-top">
                  <td className="px-5 py-4 font-semibold text-oud-brown" dir="ltr">
                    {member.email}
                  </td>
                  <td className="px-5 py-4 text-oud-muted">{displayName}</td>
                  <td className="px-5 py-4">
                    <form action={updateAction} className="flex min-w-56 items-end gap-2">
                      <input type="hidden" name="display_name" value={displayName === "-" ? "" : displayName} />
                      <Select name="role" defaultValue={member.role} aria-label="الدور">
                        {ADMIN_ROLES.map((role) => (
                          <option key={role} value={role}>
                            {adminRoleLabels[role as AdminRole]}
                          </option>
                        ))}
                      </Select>
                      <Button type="submit" size="sm">
                        حفظ
                      </Button>
                    </form>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={
                        member.is_active
                          ? "inline-flex rounded-full bg-green-900/10 px-3 py-1 text-xs font-bold text-green-900"
                          : "inline-flex rounded-full bg-red-900/10 px-3 py-1 text-xs font-bold text-red-900"
                      }
                    >
                      {member.is_active ? "نشط" : "معطل"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-oud-muted">{formatDate(member.created_at)}</td>
                  <td className="px-5 py-4 text-oud-muted">{formatDate(member.updated_at)}</td>
                  <td className="px-5 py-4">
                    <TeamMemberActions
                      memberId={member.id}
                      isActive={member.is_active}
                      isSelf={isSelf}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ar-OM", {
    dateStyle: "medium"
  }).format(new Date(value));
}

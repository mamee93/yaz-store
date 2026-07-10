import { Button, Card, Input, Select } from "@/components/ui";
import { ADMIN_ROLES, adminRoleDescriptions, adminRoleLabels } from "@/constants/admin-roles";
import { createTeamMemberAction, updateTeamMemberAction } from "@/features/team/actions";
import type { TeamMemberProfile } from "@/features/team/queries";

type TeamMemberFormProps = {
  member?: TeamMemberProfile;
};

export function TeamMemberForm({ member }: TeamMemberFormProps) {
  const action = member ? updateTeamMemberAction.bind(null, member.id) : createTeamMemberAction;

  return (
    <Card className="p-4 shadow-none sm:p-6">
      <form action={action} className="space-y-5">
        <div className="rounded-oud border border-oud-gold/25 bg-oud-gold/10 p-4 text-sm leading-7 text-oud-brown">
          لا تشارك كلمة مرور المالك. لكل عضو حساب مستقل وكلمة مرور مستقلة.
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="الاسم الكامل"
            name="full_name"
            defaultValue={member?.full_name ?? ""}
            required
          />
          <Input
            label="البريد الإلكتروني"
            name="email"
            type="email"
            defaultValue={member?.email ?? ""}
            placeholder="staff@example.com"
            dir="ltr"
            required
          />
          <Input
            label="رقم الهاتف اختياري"
            name="phone"
            defaultValue={member?.phone ?? ""}
            dir="ltr"
          />
          <Input
            label="الاسم الظاهر اختياري"
            name="display_name"
            defaultValue={member?.display_name ?? ""}
          />
          {!member ? (
            <Input
              label="كلمة مرور مؤقتة"
              name="temporary_password"
              type="password"
              minLength={8}
              required
              hint="8 أحرف على الأقل. لا يتم تخزينها في قاعدة البيانات."
            />
          ) : null}
          <Select label="الدور" name="role" defaultValue={member?.role ?? "cashier"} required>
            {ADMIN_ROLES.filter((role) => role !== "owner" || member?.role === "owner").map((role) => (
              <option key={role} value={role}>
                {adminRoleLabels[role]}
              </option>
            ))}
          </Select>
        </div>

        <label className="flex items-center gap-3 rounded-oud border border-oud-brown/10 bg-white px-4 py-3 text-sm font-semibold text-oud-brown">
          <input
            type="checkbox"
            name="is_active"
            defaultChecked={member?.is_active ?? true}
            className="size-4 accent-oud-brown"
          />
          الحساب نشط
        </label>

        <Button type="submit" className="w-full sm:w-auto">
          {member ? "حفظ التغييرات" : "إنشاء عضو الفريق"}
        </Button>
      </form>

      <div className="mt-6 grid gap-3 text-sm leading-7 text-oud-muted md:grid-cols-2">
        {ADMIN_ROLES.map((role) => (
          <p key={role} className="rounded-oud bg-oud-beige/30 p-3">
            <span className="font-bold text-oud-brown">{adminRoleLabels[role]}: </span>
            {adminRoleDescriptions[role]}
          </p>
        ))}
      </div>
    </Card>
  );
}

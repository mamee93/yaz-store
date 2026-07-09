import { Button, Card, Input, Select } from "@/components/ui";
import {
  ADMIN_ROLES,
  adminRoleDescriptions,
  adminRoleLabels
} from "@/constants/admin-roles";
import { createTeamMemberAction } from "@/features/team/actions";

export function TeamMemberForm() {
  return (
    <Card className="p-4 shadow-none sm:p-5">
      <h2 className="font-display text-xl font-bold text-oud-brown sm:text-2xl">
        إضافة عضو فريق
      </h2>
      <p className="mt-2 text-sm leading-7 text-oud-muted">
        أضف الموظف بالبريد المرتبط بحساب Supabase Auth. إذا لم يكن موجوداً سيحاول النظام إرسال دعوة.
      </p>

      <form action={createTeamMemberAction} className="mt-5 space-y-4">
        <Input
          label="البريد الإلكتروني"
          name="email"
          type="email"
          placeholder="staff@example.com"
          dir="ltr"
          required
        />
        <Input label="الاسم الظاهر اختياري" name="display_name" placeholder="مثال: فريق الطلبات" />
        <Select label="الدور" name="role" defaultValue="order_staff" required>
          {ADMIN_ROLES.map((role) => (
            <option key={role} value={role}>
              {adminRoleLabels[role]}
            </option>
          ))}
        </Select>
        <Button type="submit" className="w-full">
          إضافة إلى الفريق
        </Button>
      </form>

      <div className="mt-5 space-y-3 rounded-oud bg-oud-beige/30 p-4 text-xs leading-6 text-oud-muted">
        {ADMIN_ROLES.map((role) => (
          <p key={role}>
            <span className="font-bold text-oud-brown">{adminRoleLabels[role]}:</span>{" "}
            {adminRoleDescriptions[role]}
          </p>
        ))}
      </div>
    </Card>
  );
}

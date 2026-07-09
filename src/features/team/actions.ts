"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminRole } from "@/features/auth/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import { teamMemberSchema, updateTeamMemberSchema } from "@/validations/team-schema";
import type { Database } from "@/types/database";

type AuthUserLite = {
  id: string;
  email?: string;
};

const adminTeamPath = "/admin/team";

export async function createTeamMemberAction(formData: FormData) {
  const owner = await requireOwner();
  const parsed = teamMemberSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    redirectWithMessage("error", parsed.error.issues[0]?.message ?? "تعذر إضافة عضو الفريق.");
  }

  const supabase = createAdminClient();
  const email = parsed.data.email;
  const existingAdmin = await getAdminByEmail(email);

  if (existingAdmin) {
    redirectWithMessage("error", "هذا البريد مضاف إلى الفريق مسبقاً.");
  }

  const authUser = await getOrInviteAuthUser(email);

  if (!authUser) {
    redirectWithMessage(
      "error",
      "تعذر العثور على مستخدم بهذا البريد أو إرسال دعوة. تحقق من إعدادات Supabase Auth."
    );
  }

  const { error } = await supabase.from("admins").insert({
    auth_user_id: authUser.id,
    email,
    full_name: parsed.data.display_name,
    display_name: parsed.data.display_name,
    role: parsed.data.role,
    is_active: true,
    invited_by: owner.id
  } as Database["public"]["Tables"]["admins"]["Insert"] as never);

  if (error) {
    redirectWithMessage("error", getTeamErrorMessage(error.code));
  }

  revalidateTeamPaths();
  redirectWithMessage("success", "تمت إضافة عضو الفريق بنجاح.");
}

export async function updateTeamMemberAction(memberId: string, formData: FormData) {
  await requireOwner();
  const parsed = updateTeamMemberSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    redirectWithMessage("error", parsed.error.issues[0]?.message ?? "تعذر تحديث عضو الفريق.");
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("admins")
    .update({
      role: parsed.data.role,
      display_name: parsed.data.display_name,
      full_name: parsed.data.display_name
    } as Database["public"]["Tables"]["admins"]["Update"] as never)
    .eq("id", memberId);

  if (error) {
    redirectWithMessage("error", getTeamErrorMessage(error.code));
  }

  revalidateTeamPaths();
  redirectWithMessage("success", "تم تحديث صلاحيات عضو الفريق.");
}

export async function toggleTeamMemberStatusAction(memberId: string, isActive: boolean) {
  const owner = await requireOwner();

  if (memberId === owner.id && !isActive) {
    redirectWithMessage("error", "لا يمكنك تعطيل حسابك أثناء إدارة الفريق.");
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("admins")
    .update({ is_active: isActive } as Database["public"]["Tables"]["admins"]["Update"] as never)
    .eq("id", memberId);

  if (error) {
    redirectWithMessage("error", "تعذر تحديث حالة عضو الفريق.");
  }

  revalidateTeamPaths();
  redirectWithMessage(
    "success",
    isActive ? "تم تفعيل عضو الفريق." : "تم تعطيل عضو الفريق."
  );
}

async function requireOwner() {
  const owner = await requireAdminRole(["owner"]);

  if (!owner) {
    redirect("/admin?status=error&message=ليست لديك صلاحية لإدارة الفريق.");
  }

  return owner;
}

async function getAdminByEmail(email: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("admins")
    .select("id")
    .eq("email", email)
    .maybeSingle()
    .returns<{ id: string } | null>();

  return data;
}

async function getOrInviteAuthUser(email: string): Promise<AuthUserLite | null> {
  const existing = await findAuthUserByEmail(email);

  if (existing) {
    return existing;
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.auth.admin.inviteUserByEmail(email);

  if (error) {
    const retryExisting = await findAuthUserByEmail(email);
    return retryExisting;
  }

  return data.user ? { id: data.user.id, email: data.user.email } : null;
}

async function findAuthUserByEmail(email: string): Promise<AuthUserLite | null> {
  const supabase = createAdminClient();
  const normalizedEmail = email.toLowerCase();
  let page = 1;

  while (page <= 10) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 100
    });

    if (error) {
      return null;
    }

    const user = data.users.find((item) => item.email?.toLowerCase() === normalizedEmail);

    if (user) {
      return { id: user.id, email: user.email };
    }

    if (data.users.length < 100) {
      return null;
    }

    page += 1;
  }

  return null;
}

function revalidateTeamPaths() {
  revalidatePath(adminTeamPath);
  revalidatePath("/admin");
}

function redirectWithMessage(status: "success" | "error", message: string): never {
  const params = new URLSearchParams({ status, message });
  redirect(`${adminTeamPath}?${params.toString()}`);
}

function getTeamErrorMessage(code?: string) {
  if (code === "23505") {
    return "هذا البريد أو المستخدم مضاف إلى الفريق مسبقاً.";
  }

  if (code === "23514") {
    return "الدور المحدد غير صحيح.";
  }

  return "تعذر حفظ عضو الفريق. حاول مرة أخرى.";
}

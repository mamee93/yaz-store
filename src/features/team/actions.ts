"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logAdminActivity } from "@/features/admin-audit/log";
import { requireAdminRole } from "@/features/auth/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  teamMemberSchema,
  updateTeamMemberRoleSchema,
  updateTeamMemberSchema
} from "@/validations/team-schema";
import type { AdminRole } from "@/constants/admin-roles";
import type { Database } from "@/types/database";

const adminTeamPath = "/admin/team";

export async function createTeamMemberAction(formData: FormData) {
  const owner = await requireOwner();
  const parsed = teamMemberSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    redirectWithMessage("error", parsed.error.issues[0]?.message ?? "تعذر إضافة عضو الفريق.", "/admin/team/new");
  }

  if (parsed.data.role === "owner") {
    redirectWithMessage("error", "لا يمكن إنشاء مالك إضافي من الواجهة.", "/admin/team/new");
  }

  const supabase = createAdminClient();
  const email = parsed.data.email;
  const existingAdmin = await getAdminByEmail(email);

  if (existingAdmin) {
    redirectWithMessage("error", "هذا البريد مضاف إلى الفريق مسبقا.", "/admin/team/new");
  }

  const { data: createdUser, error: authError } = await supabase.auth.admin.createUser({
    email,
    password: parsed.data.temporary_password,
    email_confirm: true,
    user_metadata: {
      full_name: parsed.data.full_name,
      phone: parsed.data.phone,
      admin_role: parsed.data.role
    }
  });

  if (authError || !createdUser.user) {
    console.error("Failed to create admin auth user", authError);
    redirectWithMessage("error", "تعذر إنشاء حساب الدخول. تحقق من إعدادات Supabase Auth.", "/admin/team/new");
  }

  const insertPayload: Database["public"]["Tables"]["admins"]["Insert"] = {
    auth_user_id: createdUser.user.id,
    full_name: parsed.data.full_name,
    display_name: parsed.data.full_name,
    email,
    phone: parsed.data.phone,
    role: parsed.data.role,
    is_active: parsed.data.is_active,
    must_change_password: true,
    created_by: owner.id
  };

  const { data: member, error: insertError } = await supabase
    .from("admins")
    .insert(insertPayload)
    .select("id,auth_user_id,full_name,display_name,email,role,is_active")
    .single()
    .returns<Database["public"]["Tables"]["admins"]["Row"]>();

  if (insertError || !member) {
    console.error("Failed to create admin row; rolling back auth user", insertError);
    await supabase.auth.admin.deleteUser(createdUser.user.id);
    redirectWithMessage("error", getTeamErrorMessage(insertError?.code), "/admin/team/new");
  }

  await logAdminActivity({
    admin: owner,
    action: "admin.create",
    entityType: "admin",
    entityId: member.id,
    description: `تم إنشاء حساب إداري لـ ${member.full_name}`,
    metadata: { role: member.role, email: member.email }
  });

  revalidateTeamPaths(member.id);
  redirectWithMessage("success", "تمت إضافة عضو الفريق بنجاح.");
}

export async function updateTeamMemberAction(memberId: string, formData: FormData) {
  const owner = await requireOwner();
  const parsed = updateTeamMemberSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    redirectWithMessage("error", parsed.error.issues[0]?.message ?? "تعذر تحديث عضو الفريق.", `/admin/team/${memberId}`);
  }

  const member = await getAdminById(memberId);
  if (!member) {
    redirectWithMessage("error", "عضو الفريق غير موجود.");
  }

  assertCanMutateMember(owner.id, member, {
    nextRole: parsed.data.role,
    nextActive: parsed.data.is_active
  });

  const supabase = createAdminClient();
  const { error: authUpdateError } = await supabase.auth.admin.updateUserById(member.auth_user_id, {
    email: parsed.data.email,
    user_metadata: {
      full_name: parsed.data.full_name,
      phone: parsed.data.phone,
      admin_role: parsed.data.role
    }
  });

  if (authUpdateError) {
    console.error("Failed to update admin auth user", authUpdateError);
    redirectWithMessage("error", "تعذر تحديث حساب الدخول لهذا الإداري.", `/admin/team/${memberId}`);
  }

  const { error } = await supabase
    .from("admins")
    .update({
      full_name: parsed.data.full_name,
      display_name: parsed.data.display_name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      role: parsed.data.role,
      is_active: parsed.data.is_active
    })
    .eq("id", memberId);

  if (error) {
    redirectWithMessage("error", getTeamErrorMessage(error.code), `/admin/team/${memberId}`);
  }

  await logAdminActivity({
    admin: owner,
    action: "admin.update",
    entityType: "admin",
    entityId: memberId,
    description: `تم تحديث بيانات ${parsed.data.full_name}`,
    metadata: { role: parsed.data.role, is_active: parsed.data.is_active }
  });

  revalidateTeamPaths(memberId);
  redirectWithMessage("success", "تم تحديث بيانات عضو الفريق.", `/admin/team/${memberId}`);
}

export async function updateTeamMemberRoleAction(memberId: string, formData: FormData) {
  const owner = await requireOwner();
  const parsed = updateTeamMemberRoleSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    redirectWithMessage("error", parsed.error.issues[0]?.message ?? "تعذر تحديث الدور.");
  }

  const member = await getAdminById(memberId);
  if (!member) {
    redirectWithMessage("error", "عضو الفريق غير موجود.");
  }

  assertCanMutateMember(owner.id, member, { nextRole: parsed.data.role });

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("admins")
    .update({ role: parsed.data.role })
    .eq("id", memberId);

  if (error) {
    redirectWithMessage("error", getTeamErrorMessage(error.code));
  }

  await logAdminActivity({
    admin: owner,
    action: "admin.update",
    entityType: "admin",
    entityId: memberId,
    description: `تم تغيير دور ${member.full_name}`,
    metadata: { from_role: member.role, to_role: parsed.data.role }
  });

  revalidateTeamPaths(memberId);
  redirectWithMessage("success", "تم تحديث دور عضو الفريق.");
}

export async function toggleTeamMemberStatusAction(memberId: string, isActive: boolean) {
  const owner = await requireOwner();
  const member = await getAdminById(memberId);

  if (!member) {
    redirectWithMessage("error", "عضو الفريق غير موجود.");
  }

  assertCanMutateMember(owner.id, member, { nextActive: isActive });

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("admins")
    .update({ is_active: isActive })
    .eq("id", memberId);

  if (error) {
    redirectWithMessage("error", "تعذر تحديث حالة عضو الفريق.");
  }

  await logAdminActivity({
    admin: owner,
    action: isActive ? "admin.enable" : "admin.disable",
    entityType: "admin",
    entityId: memberId,
    description: isActive ? `تم تفعيل ${member.full_name}` : `تم تعطيل ${member.full_name}`,
    metadata: { email: member.email, role: member.role }
  });

  revalidateTeamPaths(memberId);
  redirectWithMessage("success", isActive ? "تم تفعيل عضو الفريق." : "تم تعطيل عضو الفريق.");
}

export async function sendTeamMemberPasswordResetAction(memberId: string) {
  const owner = await requireOwner();
  const member = await getAdminById(memberId);

  if (!member) {
    redirectWithMessage("error", "عضو الفريق غير موجود.");
  }

  const supabase = createAdminClient();
  const { error } = await supabase.auth.resetPasswordForEmail(member.email, {
    redirectTo: `${await getAppUrl()}/auth/callback?next=/reset-password`
  });

  if (error) {
    console.error("Failed to send admin password reset", error);
    redirectWithMessage("error", "تعذر إرسال رابط إعادة تعيين كلمة المرور.", `/admin/team/${memberId}`);
  }

  await logAdminActivity({
    admin: owner,
    action: "admin.password_reset_requested",
    entityType: "admin",
    entityId: memberId,
    description: `تم إرسال رابط إعادة تعيين كلمة المرور إلى ${member.full_name}`,
    metadata: { email: member.email }
  });

  revalidateTeamPaths(memberId);
  redirectWithMessage("success", "تم إرسال رابط إعادة تعيين كلمة المرور.", `/admin/team/${memberId}`);
}

export async function deleteTestTeamMemberAction(memberId: string) {
  const owner = await requireOwner();
  const member = await getAdminById(memberId);

  if (!member) {
    redirectWithMessage("error", "عضو الفريق غير موجود.");
  }

  if (member.role === "owner") {
    redirectWithMessage("error", "لا يمكن حذف المالك.");
  }

  if (member.id === owner.id) {
    redirectWithMessage("error", "لا يمكن للمستخدم حذف نفسه.");
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("admins")
    .update({ is_active: false })
    .eq("id", memberId);

  if (error) {
    redirectWithMessage("error", "تعذر تعطيل الحساب التجريبي.", `/admin/team/${memberId}`);
  }

  await logAdminActivity({
    admin: owner,
    action: "admin.disable",
    entityType: "admin",
    entityId: memberId,
    description: `تم تعطيل الحساب التجريبي ${member.full_name} بدلا من الحذف`,
    metadata: { preferred_action: "disable_instead_of_delete" }
  });

  revalidateTeamPaths(memberId);
  redirectWithMessage("success", "تم تعطيل الحساب بدلا من حذفه حفاظا على سجل النشاط.");
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

async function getAdminById(memberId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("admins")
    .select("id,auth_user_id,full_name,display_name,email,phone,role,is_active,must_change_password,last_sign_in_at,created_by,invited_by,created_at,updated_at")
    .eq("id", memberId)
    .maybeSingle()
    .returns<Database["public"]["Tables"]["admins"]["Row"] | null>();

  return data;
}

function assertCanMutateMember(
  ownerId: string,
  member: Database["public"]["Tables"]["admins"]["Row"],
  options: { nextRole?: AdminRole; nextActive?: boolean }
) {
  if (member.id === ownerId && options.nextActive === false) {
    redirectWithMessage("error", "لا يمكن للمستخدم تعطيل نفسه.", `/admin/team/${member.id}`);
  }

  if (member.role === "owner" && options.nextRole && options.nextRole !== "owner") {
    redirectWithMessage("error", "لا يمكن تغيير دور المالك من الواجهة.", `/admin/team/${member.id}`);
  }

  if (member.role === "owner" && options.nextActive === false) {
    redirectWithMessage("error", "لا يمكن تعطيل المالك.", `/admin/team/${member.id}`);
  }

  if (options.nextRole === "owner" && member.role !== "owner") {
    redirectWithMessage("error", "لا يمكن ترقية عضو إلى مالك من الواجهة.", `/admin/team/${member.id}`);
  }
}

async function getAppUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, "");
  }

  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin");

  if (origin) {
    return origin;
  }

  const host = requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";

  return host ? `${protocol}://${host}` : "http://localhost:3000";
}

function revalidateTeamPaths(memberId?: string) {
  revalidatePath(adminTeamPath);
  revalidatePath("/admin/activity");
  revalidatePath("/admin");

  if (memberId) {
    revalidatePath(`/admin/team/${memberId}`);
  }
}

function redirectWithMessage(
  status: "success" | "error",
  message: string,
  path = adminTeamPath
): never {
  const params = new URLSearchParams({ status, message });
  redirect(`${path}?${params.toString()}`);
}

function getTeamErrorMessage(code?: string) {
  if (code === "23505") {
    return "هذا البريد أو المستخدم مضاف إلى الفريق مسبقا.";
  }

  if (code === "23514") {
    return "الدور المحدد غير صحيح.";
  }

  return "تعذر حفظ عضو الفريق. حاول مرة أخرى.";
}

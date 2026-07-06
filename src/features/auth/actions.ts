"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function loginRedirect(message: string): never {
  redirect(`/login?error=${encodeURIComponent(message)}`);
}

export async function loginAction(formData: FormData) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    loginRedirect("لم يتم إعداد اتصال Supabase بعد.");
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email) {
    loginRedirect("يرجى إدخال البريد الإلكتروني.");
  }

  if (!password) {
    loginRedirect("يرجى إدخال كلمة المرور.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  const user = data.user;

  if (error || !user) {
    loginRedirect("بيانات الدخول غير صحيحة.");
  }

  const { data: admin, error: adminError } = await supabase
    .from("admins")
    .select("id,is_active")
    .eq("auth_user_id", user.id)
    .maybeSingle()
    .returns<{ id: string; is_active: boolean } | null>();

  if (adminError || !admin) {
    await supabase.auth.signOut();
    loginRedirect("هذا الحساب غير مصرح له بدخول لوحة الإدارة.");
  }

  if (!admin.is_active) {
    await supabase.auth.signOut();
    loginRedirect("حساب الإدارة غير مفعّل حالياً.");
  }

  redirect("/admin");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login?message=تم تسجيل الخروج بنجاح.");
}

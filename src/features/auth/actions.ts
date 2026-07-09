"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function loginRedirect(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

export async function customerLoginAction(formData: FormData) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    loginRedirect("/login", "لم يتم إعداد اتصال Supabase بعد.");
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email) {
    loginRedirect("/login", "يرجى إدخال البريد الإلكتروني.");
  }

  if (!password) {
    loginRedirect("/login", "يرجى إدخال كلمة المرور.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error || !data.user) {
    loginRedirect("/login", "بيانات الدخول غير صحيحة.");
  }

  if (await isActiveAdminUser(data.user.id)) {
    redirect("/admin");
  }

  redirect("/account");
}

export async function registerCustomerAction(formData: FormData) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    loginRedirect("/register", "لم يتم إعداد اتصال Supabase بعد.");
  }

  const fullName = String(formData.get("fullName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!fullName) {
    loginRedirect("/register", "يرجى إدخال الاسم الكامل.");
  }

  if (!phone) {
    loginRedirect("/register", "يرجى إدخال رقم الهاتف.");
  }

  if (!email) {
    loginRedirect("/register", "يرجى إدخال البريد الإلكتروني.");
  }

  if (password.length < 6) {
    loginRedirect("/register", "كلمة المرور يجب أن تكون 6 أحرف على الأقل.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        phone
      }
    }
  });

  if (error || !data.user) {
    loginRedirect("/register", "تعذر إنشاء الحساب. تحقق من البيانات أو جرّب بريدا آخر.");
  }

  const admin = createAdminClient();
  await admin.from("customers").upsert(
    {
      auth_user_id: data.user.id,
      full_name: fullName,
      phone,
      email
    } as never,
    {
      onConflict: "auth_user_id"
    }
  );

  redirect("/account");
}

export async function adminLoginAction(formData: FormData) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    loginRedirect("/admin/login", "لم يتم إعداد اتصال Supabase بعد.");
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email) {
    loginRedirect("/admin/login", "يرجى إدخال البريد الإلكتروني.");
  }

  if (!password) {
    loginRedirect("/admin/login", "يرجى إدخال كلمة المرور.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  const user = data.user;

  if (error || !user) {
    loginRedirect("/admin/login", "بيانات الدخول غير صحيحة.");
  }

  const { data: admin, error: adminError } = await supabase
    .from("admins")
    .select("id,is_active")
    .eq("auth_user_id", user.id)
    .maybeSingle()
    .returns<{ id: string; is_active: boolean } | null>();

  if (adminError || !admin) {
    redirect("/account");
  }

  if (!admin.is_active) {
    await supabase.auth.signOut();
    loginRedirect("/admin/login", "حساب الإدارة غير مفعّل حالياً.");
  }

  redirect("/admin");
}

async function isActiveAdminUser(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("admins")
    .select("is_active")
    .eq("auth_user_id", userId)
    .maybeSingle()
    .returns<{ is_active: boolean } | null>();

  return Boolean(data?.is_active);
}

export async function customerLogoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login?message=تم تسجيل الخروج بنجاح.");
}

export async function adminLogoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login?message=تم تسجيل الخروج بنجاح.");
}

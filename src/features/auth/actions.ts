"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function loginRedirect(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

function messageRedirect(path: string, message: string): never {
  redirect(`${path}?message=${encodeURIComponent(message)}`);
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

export async function customerLoginAction(formData: FormData) {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    loginRedirect("/login", "لم يتم إعداد اتصال Supabase بعد.");
  }

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
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
    if (error?.message.toLowerCase().includes("email not confirmed")) {
      loginRedirect(
        "/login",
        "يرجى تفعيل البريد الإلكتروني أولاً من رسالة التفعيل."
      );
    }

    loginRedirect("/login", "البريد الإلكتروني أو كلمة المرور غير صحيحة.");
  }

  if (await isActiveAdminUser(data.user.id)) {
    redirect("/admin");
  }

  redirect("/account");
}

export async function registerCustomerAction(formData: FormData) {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    loginRedirect("/register", "لم يتم إعداد اتصال Supabase بعد.");
  }

  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!fullName) {
    loginRedirect("/register", "يرجى إدخال الاسم الكامل.");
  }

  if (!email) {
    loginRedirect("/register", "يرجى إدخال البريد الإلكتروني.");
  }

  if (password.length < 6) {
    loginRedirect(
      "/register",
      "كلمة المرور يجب أن تكون 6 أحرف على الأقل."
    );
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${await getAppUrl()}/auth/callback`,
      data: {
        full_name: fullName
      }
    }
  });

  if (error || !data.user) {
    const errorMessage = error?.message.toLowerCase() ?? "";

    if (
      errorMessage.includes("already registered") ||
      errorMessage.includes("already exists") ||
      errorMessage.includes("user already")
    ) {
      loginRedirect(
        "/register",
        "هذا البريد الإلكتروني مسجل مسبقاً. سجّل الدخول مباشرة."
      );
    }

    console.error("registerCustomerAction failed:", error);

    loginRedirect(
      "/register",
      error?.message ?? "تعذر إنشاء الحساب. حاول مرة أخرى."
    );
  }

  // عند تعطيل تأكيد البريد قد ينشئ Supabase جلسة مباشرة.
  // نسجل الخروج حتى يكون التدفق موحداً: تفعيل البريد ثم تسجيل الدخول.
  if (data.session) {
    await supabase.auth.signOut({ scope: "local" });
  }

  redirect(
    `/login?message=${encodeURIComponent(
      "تم إنشاء الحساب. افتح بريدك الإلكتروني واضغط رابط التفعيل، ثم سجّل الدخول."
    )}`
  );
}

export async function requestPasswordResetAction(formData: FormData) {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    loginRedirect("/forgot-password", "لم يتم إعداد اتصال Supabase بعد.");
  }

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (!email) {
    loginRedirect("/forgot-password", "يرجى إدخال البريد الإلكتروني.");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await getAppUrl()}/reset-password`
  });

  if (error) {
    console.error("requestPasswordResetAction failed:", {
      message: error.message,
      status: error.status
    });

    loginRedirect(
      "/forgot-password",
      "تعذر إرسال رابط الاستعادة حالياً. حاول مرة أخرى بعد قليل."
    );
  }

  messageRedirect(
    "/forgot-password",
    "إذا كان البريد مسجلاً فسيصلك رابط إعادة تعيين كلمة المرور."
  );
}

export async function adminLoginAction(formData: FormData) {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    loginRedirect("/admin/login", "لم يتم إعداد اتصال Supabase بعد.");
  }

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
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
    if (error?.message.toLowerCase().includes("email not confirmed")) {
      loginRedirect(
        "/admin/login",
        "يرجى تفعيل البريد الإلكتروني أولاً."
      );
    }

    loginRedirect(
      "/admin/login",
      "البريد الإلكتروني أو كلمة المرور غير صحيحة."
    );
  }

  const { admin, error: adminError } = await getAdminLoginProfile(user.id);

  if (adminError) {
    await supabase.auth.signOut({ scope: "local" });

    loginRedirect(
      "/admin/login",
      "تعذر التحقق من حساب الإدارة."
    );
  }

  if (!admin) {
    await supabase.auth.signOut({ scope: "local" });

    loginRedirect(
      "/admin/login",
      "هذا الحساب غير مسجل كحساب إداري."
    );
  }

  if (!admin.is_active) {
    await supabase.auth.signOut({ scope: "local" });

    loginRedirect(
      "/admin/login",
      "حساب الإدارة غير مفعّل حالياً."
    );
  }

  redirect("/admin");
}

async function isActiveAdminUser(userId: string) {
  const { admin } = await getAdminLoginProfile(userId);

  return Boolean(admin?.is_active);
}

async function getAdminLoginProfile(userId: string) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      admin: null,
      error: new Error("SUPABASE_SERVICE_ROLE_KEY is missing.")
    };
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("admins")
    .select("id,is_active")
    .eq("auth_user_id", userId)
    .maybeSingle()
    .returns<{ id: string; is_active: boolean } | null>();

  return {
    admin: data,
    error
  };
}

export async function customerLogoutAction() {
  await safeSignOut("customerLogoutAction");
  redirect("/");
}

export async function adminLogoutAction() {
  await safeSignOut("adminLogoutAction");
  redirect("/admin/login");
}

async function safeSignOut(source: string) {
  try {
    const supabase = await createClient();

    const result = await Promise.race([
      supabase.auth.signOut({ scope: "local" }),
      new Promise<{ error: Error }>((resolve) => {
        setTimeout(
          () =>
            resolve({
              error: new Error("Timed out while signing out locally.")
            }),
          3000
        );
      })
    ]);

    const { error } = result;

    if (error) {
      console.error(`${source} failed`, error.message);
    }
  } catch (error) {
    console.error(`${source} failed`, error);
  }
}

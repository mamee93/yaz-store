"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { customerDeliveryProfileSchema } from "@/validations/customer-profile-schema";

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
  const deliveryProfile = customerDeliveryProfileSchema.safeParse({
    phone,
    governorate: formData.get("governorate"),
    wilayat: formData.get("wilayat"),
    area: formData.get("area"),
    detailed_address: formData.get("detailed_address")
  });

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

  if (!deliveryProfile.success) {
    loginRedirect(
      "/register",
      deliveryProfile.error.issues[0]?.message ?? "تحقق من بيانات التوصيل."
    );
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
      phone: deliveryProfile.data.phone,
      email,
      governorate: deliveryProfile.data.governorate,
      wilayat: deliveryProfile.data.wilayat,
      area: deliveryProfile.data.area,
      detailed_address: deliveryProfile.data.detailed_address
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

  const { admin, error: adminError } = await getAdminLoginProfile(user.id);

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
  const { admin } = await getAdminLoginProfile(userId);

  return Boolean(admin?.is_active);
}

async function getAdminLoginProfile(userId: string) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { admin: null, error: null };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("admins")
    .select("id,is_active")
    .eq("auth_user_id", userId)
    .maybeSingle()
    .returns<{ id: string; is_active: boolean } | null>();

  return { admin: data, error };
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
        setTimeout(() => resolve({ error: new Error("Timed out while signing out locally.") }), 3000);
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

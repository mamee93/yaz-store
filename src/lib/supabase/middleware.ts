import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { CookieOptions } from "@supabase/ssr";
import { canAccessAdminPath, normalizeAdminRole, type AdminRole } from "@/constants/admin-roles";
import type { Database } from "@/types/database";

type CookieToSet = {
  name: string;
  value: string;
  options: CookieOptions;
};

type MiddlewareAdmin = {
  is_active: boolean;
  role: string;
};

export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const pathname = request.nextUrl.pathname;
  const isAdminRoute = pathname.startsWith("/admin");
  const isAdminLoginRoute = pathname === "/admin/login";
  const isLoginRoute = pathname === "/login" || isAdminLoginRoute;

  if (!supabaseUrl || !supabaseAnonKey) {
    if (isAdminRoute && !isAdminLoginRoute) {
      return redirectToLogin(request, "لم يتم إعداد اتصال Supabase بعد.");
    }

    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({ request });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      }
    }
  });

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (isAdminRoute && !isAdminLoginRoute && !user) {
    return withSessionCookies(response, redirectToLogin(request));
  }

  if (!isAdminRoute && !isLoginRoute) {
    return response;
  }

  if (!user) {
    return response;
  }

  const { data: admin } = await supabase
    .from("admins")
    .select("is_active,role")
    .eq("auth_user_id", user.id)
    .maybeSingle()
    .returns<MiddlewareAdmin | null>();

  const isActiveAdmin = Boolean(admin?.is_active);
  const role: AdminRole = normalizeAdminRole(admin?.role);

  if (isAdminRoute && !isAdminLoginRoute && !isActiveAdmin) {
    await supabase.auth.signOut();
    return withSessionCookies(
      response,
      redirectToLogin(request, "هذا الحساب غير مصرح له بدخول لوحة الإدارة.")
    );
  }

  if (isAdminRoute && !isAdminLoginRoute && !canAccessAdminPath(role, pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/admin";
    redirectUrl.search = "";
    redirectUrl.searchParams.set("status", "error");
    redirectUrl.searchParams.set("message", "ليست لديك صلاحية للوصول إلى هذا القسم.");
    return withSessionCookies(response, NextResponse.redirect(redirectUrl));
  }

  if (isAdminLoginRoute && isActiveAdmin) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/admin";
    redirectUrl.search = "";
    return withSessionCookies(response, NextResponse.redirect(redirectUrl));
  }

  return response;
}

function redirectToLogin(request: NextRequest, error?: string) {
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = request.nextUrl.pathname.startsWith("/admin") ? "/admin/login" : "/login";
  redirectUrl.search = "";

  if (request.nextUrl.pathname !== "/login") {
    redirectUrl.searchParams.set("next", request.nextUrl.pathname);
  }

  if (error) {
    redirectUrl.searchParams.set("error", error);
  }

  return NextResponse.redirect(redirectUrl);
}

function withSessionCookies(source: NextResponse, target: NextResponse) {
  source.cookies.getAll().forEach((cookie) => {
    target.cookies.set(cookie);
  });

  return target;
}

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent("تعذر تفعيل الحساب أو انتهت صلاحية الرابط.")}`,
        request.url
      )
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("Email confirmation callback failed:", {
      message: error.message,
      status: error.status
    });

    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent("تعذر تفعيل الحساب أو انتهت صلاحية الرابط.")}`,
        request.url
      )
    );
  }

  return NextResponse.redirect(
    new URL(
      `/login?message=${encodeURIComponent("تم تفعيل حسابك بنجاح. يمكنك تسجيل الدخول الآن.")}`,
      request.url
    )
  );
}

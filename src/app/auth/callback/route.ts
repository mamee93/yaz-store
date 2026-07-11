import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

const invalidRecoveryMessage = "رابط الاستعادة غير صالح أو انتهت صلاحيته.";
const confirmationErrorMessage = "تعذر تفعيل الحساب أو انتهت صلاحية الرابط.";
const confirmationSuccessMessage = "تم تفعيل حسابك بنجاح. يمكنك تسجيل الدخول الآن.";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextPath = getSafeNextPath(requestUrl.searchParams.get("next"));
  const isRecoveryCallback = nextPath === "/reset-password";
  const callbackError = requestUrl.searchParams.get("error") ?? requestUrl.searchParams.get("error_code");

  if (callbackError) {
    return NextResponse.redirect(
      buildRedirectUrl(
        request,
        isRecoveryCallback ? "/reset-password" : "/login",
        isRecoveryCallback ? "error" : "error",
        isRecoveryCallback ? invalidRecoveryMessage : confirmationErrorMessage
      )
    );
  }

  if (!code) {
    return NextResponse.redirect(
      buildRedirectUrl(
        request,
        isRecoveryCallback ? "/reset-password" : "/login",
        "error",
        isRecoveryCallback ? invalidRecoveryMessage : confirmationErrorMessage
      )
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("Auth callback code exchange failed:", {
      message: error.message,
      status: error.status,
      next: nextPath
    });

    return NextResponse.redirect(
      buildRedirectUrl(
        request,
        isRecoveryCallback ? "/reset-password" : "/login",
        "error",
        isRecoveryCallback ? invalidRecoveryMessage : confirmationErrorMessage
      )
    );
  }

  if (isRecoveryCallback) {
    return NextResponse.redirect(new URL("/reset-password", request.url));
  }

  return NextResponse.redirect(
    buildRedirectUrl(request, "/login", "message", confirmationSuccessMessage)
  );
}

function getSafeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return null;
  }

  return value;
}

function buildRedirectUrl(
  request: NextRequest,
  pathname: string,
  param: "error" | "message",
  message: string
) {
  const redirectUrl = new URL(pathname, request.url);
  redirectUrl.searchParams.set(param, message);
  return redirectUrl;
}

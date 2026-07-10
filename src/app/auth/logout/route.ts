import { NextResponse, type NextRequest } from "next/server";
import { recordAdminLogout } from "@/features/auth/actions";

export async function GET(request: NextRequest) {
  const redirectUrl = new URL(request.nextUrl.searchParams.get("scope") === "admin" ? "/admin/login" : "/", request.url);
  const response = NextResponse.redirect(redirectUrl);

  if (request.nextUrl.searchParams.get("scope") === "admin") {
    await recordAdminLogout("authLogoutRoute");
  }

  request.cookies
    .getAll()
    .filter((cookie) => cookie.name.startsWith("sb-"))
    .forEach((cookie) => {
      response.cookies.set(cookie.name, "", {
        httpOnly: true,
        maxAge: 0,
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production"
      });
    });

  return response;
}

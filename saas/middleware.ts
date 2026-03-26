import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Admin: require matching email
  if (pathname.startsWith("/admin")) {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail || token.email !== adminEmail) {
      return NextResponse.redirect(new URL("/inicio", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/inicio/:path*",
    "/fraternidade/:path*",
    "/oracao/:path*",
    "/devocional/:path*",
    "/perfil/:path*",
    "/perfil",
    "/diario/:path*",
    "/versiculo/:path*",
    "/plano-leitura/:path*",
    "/admin/:path*",
  ],
};

import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req });
  const { pathname } = req.nextUrl;

  // Admin: require session + matching email
  if (pathname.startsWith("/admin")) {
    if (!token) return NextResponse.redirect(new URL("/sign-in", req.url));
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail || token.email !== adminEmail) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // Protected app routes: require session
  if (!token) return NextResponse.redirect(new URL("/sign-in", req.url));
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
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

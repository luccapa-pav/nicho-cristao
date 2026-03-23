export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/dashboard/:path*", "/celula/:path*", "/oracao/:path*", "/devocional/:path*"],
};

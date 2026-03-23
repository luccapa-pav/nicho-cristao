export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/dashboard/:path*", "/fraternidade/:path*", "/oracao/:path*", "/devocional/:path*", "/perfil/:path*", "/perfil", "/diario/:path*", "/versiculo/:path*"],
};

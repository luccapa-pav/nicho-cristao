import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function VerifyEmailPage({ params }: { params: { token: string } }) {
  const record = await prisma.emailVerificationToken.findUnique({ where: { token: params.token } });

  if (!record || record.expiresAt < new Date()) {
    redirect("/verificar-email/expirado");
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { emailVerified: new Date() } }),
    prisma.emailVerificationToken.delete({ where: { id: record.id } }),
  ]);

  redirect("/verificar-email/sucesso");
}

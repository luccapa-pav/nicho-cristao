import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rateLimit";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { limited } = await checkRateLimit(`resend-verify:${session.user.id}`, 3, 60);
  if (limited) {
    return NextResponse.json({ error: "Muitas tentativas. Aguarde 1 hora." }, { status: 429 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, name: true, emailVerified: true },
  });

  if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  if (user.emailVerified) return NextResponse.json({ error: "Email já verificado" }, { status: 400 });

  // Delete previous tokens
  await prisma.emailVerificationToken.deleteMany({ where: { userId: session.user.id } });

  const token = await prisma.emailVerificationToken.create({
    data: {
      userId: session.user.id,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  try {
    await sendVerificationEmail(user.email, user.name, token.token);
  } catch {
    return NextResponse.json({ error: "Falha ao enviar email. Tente novamente." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

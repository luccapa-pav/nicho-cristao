import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "Email obrigatório" }, { status: 400 });

  const { limited } = await checkRateLimit(`forgot:${email.toLowerCase().trim()}`, 3, 15);
  if (limited) {
    return NextResponse.json({ error: "Muitas tentativas. Aguarde 15 minutos." }, { status: 429 });
  }

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });

  // Always return success to avoid user enumeration
  if (!user || !user.passwordHash) {
    return NextResponse.json({ ok: true });
  }

  // Invalidate previous tokens
  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } });

  const token = await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    },
  });

  try {
    await sendPasswordResetEmail(user.email, user.name, token.token);
  } catch (err) {
    console.error("Resend error:", err);
    return NextResponse.json({ error: "Falha ao enviar email. Tente novamente." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

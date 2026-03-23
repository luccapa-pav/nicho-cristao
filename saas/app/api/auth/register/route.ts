import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rateLimit";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
    const { limited } = await checkRateLimit(`register:${ip}`, 5, 15);
    if (limited) {
      return NextResponse.json({ error: "Muitas tentativas. Aguarde 15 minutos." }, { status: 429 });
    }

    const { name, email, password } = await req.json();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!name?.trim() || name.trim().length > 80) {
      return NextResponse.json({ error: "Nome inválido" }, { status: 400 });
    }
    if (!email?.trim() || !emailRegex.test(email.trim())) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 });
    }
    if (!password || password.length < 6 || password.length > 128) {
      return NextResponse.json({ error: "Senha deve ter entre 6 e 128 caracteres" }, { status: 400 });
    }

    const exists = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (exists) {
      return NextResponse.json({ error: "Email já cadastrado" }, { status: 409 });
    }

    const passwordHash = await hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        streak: { create: {} },
      },
    });

    // Send verification email (non-blocking — don't fail registration if email fails)
    try {
      const token = await prisma.emailVerificationToken.create({
        data: {
          userId: user.id,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });
      await sendVerificationEmail(user.email, user.name, token.token);
    } catch (emailErr) {
      console.error("Failed to send verification email:", emailErr);
    }

    return NextResponse.json({ id: user.id, name: user.name, email: user.email }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(e);
    console.error(msg);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

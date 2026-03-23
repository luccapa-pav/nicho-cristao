import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
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

    return NextResponse.json({ id: user.id, name: user.name, email: user.email }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(e);
    console.error(msg);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

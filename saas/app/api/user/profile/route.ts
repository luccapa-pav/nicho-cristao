import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true, name: true, email: true, bio: true,
      church: true, city: true, verse: true, ministry: true, avatarUrl: true, plan: true, createdAt: true,
      streak: { select: { currentStreak: true, longestStreak: true, totalDays: true } },
      _count: {
        select: {
          prayers: { where: { status: "ANSWERED" } },
          gratitudePosts: true,
        },
      },
    },
  });

  return NextResponse.json(user);
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, bio, church, city, verse, ministry, avatarUrl } = await req.json();

  if (!name?.trim() || name.trim().length > 80) {
    return NextResponse.json({ error: "Nome inválido" }, { status: 400 });
  }
  if (bio && bio.length > 300) {
    return NextResponse.json({ error: "Bio muito longa (máx. 300 caracteres)" }, { status: 400 });
  }
  if (church && church.length > 100) {
    return NextResponse.json({ error: "Nome da igreja muito longo" }, { status: 400 });
  }
  if (city && city.length > 80) {
    return NextResponse.json({ error: "Cidade muito longa" }, { status: 400 });
  }
  if (verse && verse.length > 200) {
    return NextResponse.json({ error: "Versículo muito longo (máx. 200 caracteres)" }, { status: 400 });
  }
  if (ministry && ministry.length > 100) {
    return NextResponse.json({ error: "Ministério muito longo" }, { status: 400 });
  }
  // avatarUrl is a resized base64 (~10KB) or external URL — cap at 50KB
  if (avatarUrl && avatarUrl.length > 51200) {
    return NextResponse.json({ error: "Imagem muito grande" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: name.trim(),
      bio: bio?.trim() || null,
      church: church?.trim() || null,
      city: city?.trim() || null,
      verse: verse?.trim() || null,
      ministry: ministry?.trim() || null,
      ...(avatarUrl !== undefined ? { avatarUrl: avatarUrl || null } : {}),
    },
    select: { id: true, name: true, bio: true, church: true, city: true, verse: true, ministry: true, avatarUrl: true },
  });

  return NextResponse.json(updated);
}

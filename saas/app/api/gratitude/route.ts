import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  const posts = await prisma.gratitudePost.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      user: { select: { name: true } },
      reactions: { select: { userId: true, type: true } },
    },
  });

  return NextResponse.json(
    posts.map((p) => ({
      id: p.id,
      author: p.user.name,
      content: p.content,
      createdAt: p.createdAt.toISOString(),
      reactions: {
        AMEN: p.reactions.filter((r) => r.type === "AMEN").length,
        GLORY: p.reactions.filter((r) => r.type === "GLORY").length,
      },
      userReacted: p.reactions.find((r) => r.userId === userId)?.type ?? null,
    }))
  );
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { content } = await req.json();
  if (!content?.trim() || content.trim().length > 600) {
    return NextResponse.json({ error: "Conteúdo inválido (máx. 600 caracteres)" }, { status: 400 });
  }

  try {
    const post = await prisma.gratitudePost.create({
      data: { userId: session.user.id, content: content.trim() },
      include: { user: { select: { name: true } } },
    });
    return NextResponse.json({
      id: post.id,
      author: post.user.name,
      content: post.content,
      createdAt: post.createdAt.toISOString(),
      reactions: { AMEN: 0, GLORY: 0 },
      userReacted: null,
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

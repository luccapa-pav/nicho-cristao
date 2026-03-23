import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { type } = await req.json() as { type: "AMEN" | "GLORY" };
  if (type !== "AMEN" && type !== "GLORY")
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });

  const userId = session.user.id;
  const postId = params.id;

  const existing = await prisma.reaction.findUnique({ where: { postId_userId: { postId, userId } } });

  if (existing) {
    if (existing.type === type) {
      // Toggle off
      await prisma.reaction.delete({ where: { postId_userId: { postId, userId } } });
      return NextResponse.json({ userReacted: null });
    } else {
      // Switch reaction
      await prisma.reaction.update({ where: { postId_userId: { postId, userId } }, data: { type } });
      return NextResponse.json({ userReacted: type });
    }
  }

  await prisma.reaction.create({ data: { postId, userId, type } });

  // Notificar dono do post (se for outra pessoa reagindo)
  const post = await prisma.gratitudePost.findUnique({ where: { id: postId }, select: { userId: true } });
  if (post && post.userId !== userId) {
    const actor = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });
    const reactionLabel = type === "AMEN" ? "Amém" : "Glória a Deus";
    const { createNotification } = await import("@/lib/notifications");
    await createNotification({
      userId: post.userId,
      type: "REACTION",
      title: `${reactionLabel} recebido! 🙏`,
      body: `${actor?.name ?? "Alguém"} reagiu ao seu post de gratidão`,
      link: "/gratidao",
    });
  }

  return NextResponse.json({ userReacted: type });
}

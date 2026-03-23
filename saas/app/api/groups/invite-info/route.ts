import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Token inválido" }, { status: 400 });

  const invite = await prisma.groupInvite.findUnique({
    where: { token },
    select: {
      status: true,
      expiresAt: true,
      sender: { select: { name: true } },
      group: {
        select: {
          name: true,
          maxMembers: true,
          _count: { select: { members: true } },
        },
      },
    },
  });

  if (!invite) return NextResponse.json({ error: "Convite não encontrado" }, { status: 404 });
  if (invite.status !== "PENDING") return NextResponse.json({ error: "Este convite já foi usado" }, { status: 400 });
  if (invite.expiresAt < new Date()) return NextResponse.json({ error: "Este convite expirou" }, { status: 400 });

  return NextResponse.json({
    groupName: invite.group.name,
    memberCount: invite.group._count.members,
    maxMembers: invite.group.maxMembers,
    senderName: invite.sender.name,
  });
}

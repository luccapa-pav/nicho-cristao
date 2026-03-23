import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function isAdmin(email?: string | null) {
  return !!process.env.ADMIN_EMAIL && email === process.env.ADMIN_EMAIL;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const page = parseInt(req.nextUrl.searchParams.get("page") ?? "1");
  const skip = (page - 1) * 50;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      skip,
      take: 50,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        plan: true,
        emailVerified: true,
        createdAt: true,
        streak: { select: { currentStreak: true } },
      },
    }),
    prisma.user.count(),
  ]);

  return NextResponse.json({ users, total, page, pages: Math.ceil(total / 50) });
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  // Protect with CRON_SECRET
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId, title, body } = await req.json();

  const where = userId ? { userId } : {};
  const tokens = await prisma.fcmToken.findMany({ where, select: { token: true } });

  if (tokens.length === 0) return NextResponse.json({ sent: 0 });

  try {
    const { adminMessaging } = await import("@/lib/firebase-admin");
    const messaging = adminMessaging();

    const messages = tokens.map((t) => ({
      token: t.token,
      notification: { title: title ?? "Vida com Jesus", body: body ?? "Não esqueça seu devocional hoje! 🙏" },
      webpush: { fcmOptions: { link: "/dashboard" } },
    }));

    const response = await messaging.sendEach(messages);
    return NextResponse.json({ sent: response.successCount, failed: response.failureCount });
  } catch (err) {
    console.error("FCM send error:", err);
    return NextResponse.json({ error: "FCM not configured" }, { status: 500 });
  }
}

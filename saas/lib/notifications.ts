import { prisma } from "@/lib/prisma";
import { NotificationType } from "@prisma/client";

// Lazy import do admin para evitar erro em ambientes sem Firebase configurado
async function getAdminMessaging() {
  try {
    const { adminMessaging } = await import("@/lib/firebase-admin");
    return adminMessaging();
  } catch {
    return null;
  }
}

export async function createNotification({
  userId,
  type,
  title,
  body,
  link,
}: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
}): Promise<void> {
  try {
    await prisma.notification.create({
      data: { userId, type, title, body, link: link ?? null },
    });

    // FCM push — opcional, falha silenciosa
    const tokens = await prisma.fcmToken.findMany({
      where: { userId },
      select: { token: true },
    });

    if (tokens.length > 0) {
      const messaging = await getAdminMessaging();
      if (messaging) {
        await messaging.sendEach(
          tokens.map((t) => ({
            token: t.token,
            notification: { title, body },
            webpush: link ? { fcmOptions: { link } } : undefined,
          }))
        ).catch(() => {});
      }
    }
  } catch (err) {
    console.error("[createNotification] erro silencioso:", err);
  }
}

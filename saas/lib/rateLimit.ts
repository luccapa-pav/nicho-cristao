import { prisma } from "@/lib/prisma";

/**
 * Simple DB-backed rate limiter for serverless environments.
 * Returns { limited: true } when the key exceeds maxAttempts within windowMinutes.
 */
export async function checkRateLimit(
  key: string,
  maxAttempts: number,
  windowMinutes: number
): Promise<{ limited: boolean; remaining: number }> {
  const now = new Date();
  const windowStart = new Date(
    Math.floor(now.getTime() / (windowMinutes * 60 * 1000)) * (windowMinutes * 60 * 1000)
  );

  // Cleanup old windows (fire-and-forget)
  prisma.rateLimit
    .deleteMany({ where: { window: { lt: new Date(now.getTime() - windowMinutes * 60 * 1000 * 2) } } })
    .catch(() => {});

  const record = await prisma.rateLimit.upsert({
    where: { key_window: { key, window: windowStart } },
    create: { key, window: windowStart, count: 1 },
    update: { count: { increment: 1 } },
  });

  const remaining = Math.max(0, maxAttempts - record.count);
  return { limited: record.count > maxAttempts, remaining };
}

import { PrismaClient, Plan, GroupRole, PrayerStatus, ReactionType } from "@prisma/client";
import readingPlansData from "./data/reading-plans.json";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ── Usuários ──────────────────────────────────────────────
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: "maria@example.com" },
      update: {},
      create: { name: "Maria Silva",   email: "maria@example.com",   plan: Plan.PREMIUM },
    }),
    prisma.user.upsert({
      where: { email: "joao@example.com" },
      update: {},
      create: { name: "João Pedro",    email: "joao@example.com",    plan: Plan.PREMIUM },
    }),
    prisma.user.upsert({
      where: { email: "ana@example.com" },
      update: {},
      create: { name: "Ana Lima",      email: "ana@example.com",     plan: Plan.FREE },
    }),
    prisma.user.upsert({
      where: { email: "carlos@example.com" },
      update: {},
      create: { name: "Carlos Melo",   email: "carlos@example.com",  plan: Plan.FREE },
    }),
  ]);

  const [maria, joao, ana, carlos] = users;

  // ── Streaks ───────────────────────────────────────────────
  await Promise.all([
    prisma.streak.upsert({ where: { userId: maria.id  }, update: {}, create: { userId: maria.id,  currentStreak: 42, longestStreak: 67, totalDays: 185, lastCheckIn: new Date() } }),
    prisma.streak.upsert({ where: { userId: joao.id   }, update: {}, create: { userId: joao.id,   currentStreak: 30, longestStreak: 45, totalDays: 120, lastCheckIn: new Date() } }),
    prisma.streak.upsert({ where: { userId: ana.id    }, update: {}, create: { userId: ana.id,    currentStreak: 7,  longestStreak: 21, totalDays: 45,  lastCheckIn: new Date() } }),
    prisma.streak.upsert({ where: { userId: carlos.id }, update: {}, create: { userId: carlos.id, currentStreak: 3,  longestStreak: 15, totalDays: 22,  lastCheckIn: new Date() } }),
  ]);

  // ── Devocional de hoje ────────────────────────────────────
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const devotional = await prisma.devotional.upsert({
    where: { date: today },
    update: {},
    create: {
      date: today,
      title: "Andando pela Fé",
      verse: "Porque andamos por fé e não por vista.",
      verseRef: "2 Coríntios 5:7",
      theme: "Confiança",
      audioDuration: 345,
    },
  });

  // ── Grupo / Célula ────────────────────────────────────────
  const group = await prisma.group.upsert({
    where: { id: "grupo-filhos-luz" },
    update: {},
    create: {
      id: "grupo-filhos-luz",
      name: "Célula Filhos da Luz",
      description: "Um grupo de discipulado e comunidade.",
      progress: 68,
    },
  });

  // Membros do grupo
  for (const user of users) {
    await prisma.groupMember.upsert({
      where: { groupId_userId: { groupId: group.id, userId: user.id } },
      update: {},
      create: {
        groupId: group.id,
        userId: user.id,
        role: user.id === maria.id ? GroupRole.LEADER : GroupRole.MEMBER,
      },
    });
  }

  // ── Pedidos de Oração ─────────────────────────────────────
  await prisma.prayer.upsert({
    where: { id: "prayer-saude-pai" },
    update: {},
    create: {
      id: "prayer-saude-pai",
      userId: maria.id,
      groupId: group.id,
      title: "Saúde do meu pai",
      description: "Precisa de cirurgia na próxima semana.",
      status: PrayerStatus.PENDING,
      prayedCount: 4,
      isPublic: true,
    },
  });

  await prisma.prayer.upsert({
    where: { id: "prayer-aprovacao" },
    update: {},
    create: {
      id: "prayer-aprovacao",
      userId: maria.id,
      groupId: group.id,
      title: "Aprovação na faculdade",
      status: PrayerStatus.ANSWERED,
      prayedCount: 12,
      isPublic: true,
      answeredAt: new Date(),
    },
  });

  // ── Posts de Gratidão ─────────────────────────────────────
  const post1 = await prisma.gratitudePost.upsert({
    where: { id: "post-emprego-joao" },
    update: {},
    create: {
      id: "post-emprego-joao",
      userId: joao.id,
      content: "Glória a Deus! Consegui o emprego que tanto orei. Em 3 meses de orações, Deus respondeu perfeitamente!",
    },
  });

  await prisma.reaction.createMany({
    skipDuplicates: true,
    data: [
      { postId: post1.id, userId: maria.id,  type: ReactionType.AMEN },
      { postId: post1.id, userId: ana.id,    type: ReactionType.GLORY },
      { postId: post1.id, userId: carlos.id, type: ReactionType.AMEN },
    ],
  });

  // ── Convite ───────────────────────────────────────────────
  await prisma.groupInvite.upsert({
    where: { token: "abc123xyz" },
    update: {},
    create: {
      groupId: group.id,
      senderId: maria.id,
      token: "abc123xyz",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  // ── Planos de Leitura ─────────────────────────────────────
  for (const plan of readingPlansData) {
    const readingPlan = await prisma.readingPlan.upsert({
      where: { slug: plan.slug },
      update: { name: plan.name, daysTotal: plan.daysTotal, isPremium: plan.isPremium },
      create: { slug: plan.slug, name: plan.name, daysTotal: plan.daysTotal, isPremium: plan.isPremium },
    });

    // Insert entries in batches of 100
    const entries = plan.entries.map((e) => ({
      planId: readingPlan.id,
      day: e.day,
      reference: e.reference,
      title: e.title ?? null,
    }));
    for (let i = 0; i < entries.length; i += 100) {
      await prisma.readingEntry.createMany({
        data: entries.slice(i, i + 100),
        skipDuplicates: true,
      });
    }
  }

  console.log("✅ Seed concluído com sucesso!");
  console.log(`   Usuários: ${users.length}`);
  console.log(`   Grupo: ${group.name}`);
  console.log(`   Devocional: ${devotional.title}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

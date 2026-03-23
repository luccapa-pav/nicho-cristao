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

  // ── Devocionais (hoje -7 até hoje +22) ───────────────────
  function day(offset: number): Date {
    const d = new Date(); d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + offset); return d;
  }

  const devotionalsData = [
    { offset: -7, title: "Renovados a Cada Manhã",        verse: "As misericórdias do Senhor são novas cada manhã; grande é a sua fidelidade.", verseRef: "Lamentações 3:23",       theme: "Gratidão",        audioDuration: 310 },
    { offset: -6, title: "O Senhor É Meu Pastor",          verse: "O Senhor é o meu pastor; nada me faltará.",                                   verseRef: "Salmos 23:1",           theme: "Paz",             audioDuration: 295 },
    { offset: -5, title: "Força para Prosseguir",          verse: "Tudo posso naquele que me fortalece.",                                          verseRef: "Filipenses 4:13",       theme: "Força",           audioDuration: 320 },
    { offset: -4, title: "Confiando no Senhor",            verse: "Confia no Senhor de todo o teu coração e não te apoies no teu próprio entendimento.", verseRef: "Provérbios 3:5", theme: "Confiança",       audioDuration: 340 },
    { offset: -3, title: "Amor que Não Falha",             verse: "Nada nos poderá separar do amor de Deus que está em Cristo Jesus, nosso Senhor.", verseRef: "Romanos 8:39",       theme: "Amor",            audioDuration: 355 },
    { offset: -2, title: "Esperança que Não Decepciona",   verse: "A esperança não decepciona, porque o amor de Deus foi derramado em nossos corações.", verseRef: "Romanos 5:5",    theme: "Esperança",       audioDuration: 328 },
    { offset: -1, title: "A Paz que Excede Todo Entendimento", verse: "A paz de Deus, que excede todo o entendimento, guardará os vossos corações.", verseRef: "Filipenses 4:7",     theme: "Paz",             audioDuration: 315 },
    { offset:  0, title: "Andando pela Fé",                verse: "Porque andamos por fé e não por vista.",                                         verseRef: "2 Coríntios 5:7",     theme: "Confiança",       audioDuration: 345 },
    { offset:  1, title: "Luz no Caminho",                 verse: "A tua palavra é lâmpada que ilumina os meus passos e luz que clareia o meu caminho.", verseRef: "Salmos 119:105", theme: "Palavra de Deus", audioDuration: 300 },
    { offset:  2, title: "Perseverança na Oração",         verse: "Orai sem cessar.",                                                                verseRef: "1 Tessalonicenses 5:17", theme: "Oração",        audioDuration: 290 },
    { offset:  3, title: "Graça Suficiente",               verse: "A minha graça te basta, pois o meu poder se aperfeiçoa na fraqueza.",             verseRef: "2 Coríntios 12:9",    theme: "Graça",           audioDuration: 335 },
    { offset:  4, title: "Criados para Boas Obras",        verse: "Pois somos criação de Deus, criados em Cristo Jesus para fazer boas obras.",      verseRef: "Efésios 2:10",        theme: "Propósito",       audioDuration: 320 },
    { offset:  5, title: "Deus Cuida de Você",             verse: "Lançai sobre ele toda a vossa ansiedade, porque ele tem cuidado de vós.",         verseRef: "1 Pedro 5:7",         theme: "Confiança",       audioDuration: 310 },
    { offset:  6, title: "Renovação Interior",             verse: "Não vos conformeis com este século, mas transformai-vos pela renovação do vosso entendimento.", verseRef: "Romanos 12:2", theme: "Renovação", audioDuration: 350 },
    { offset:  7, title: "O Deus de Todo Consolo",         verse: "Bendito seja o Deus e Pai de nosso Senhor Jesus Cristo, o Pai das misericórdias.", verseRef: "2 Coríntios 1:3",   theme: "Gratidão",        audioDuration: 305 },
    { offset:  8, title: "Busca em Primeiro Lugar",        verse: "Buscai em primeiro lugar o reino de Deus e a sua justiça, e todas estas coisas vos serão acrescentadas.", verseRef: "Mateus 6:33", theme: "Fé", audioDuration: 330 },
    { offset:  9, title: "Alegria Completa",               verse: "Estas coisas vos tenho dito para que a minha alegria esteja em vós, e a vossa alegria seja completa.", verseRef: "João 15:11", theme: "Louvor", audioDuration: 315 },
    { offset: 10, title: "Mais que Vencedores",            verse: "Em todas estas coisas somos mais que vencedores, por meio daquele que nos amou.",  verseRef: "Romanos 8:37",        theme: "Força",           audioDuration: 340 },
    { offset: 11, title: "Guarda o Teu Coração",           verse: "Sobre tudo o que se deve guardar, guarda o teu coração, porque dele procedem as fontes da vida.", verseRef: "Provérbios 4:23", theme: "Sabedoria", audioDuration: 325 },
    { offset: 12, title: "Sede e Venha",                   verse: "Se alguém tem sede, venha a mim e beba.",                                         verseRef: "João 7:37",           theme: "Salvação",        audioDuration: 295 },
    { offset: 13, title: "Habitar na Presença",            verse: "Uma coisa peço ao Senhor, e a buscarei: que eu possa morar na casa do Senhor todos os dias da minha vida.", verseRef: "Salmos 27:4", theme: "Presença de Deus", audioDuration: 345 },
    { offset: 14, title: "Fruto do Espírito",              verse: "O fruto do Espírito é: amor, alegria, paz, longanimidade, benignidade, bondade, fidelidade.", verseRef: "Gálatas 5:22", theme: "Amor", audioDuration: 360 },
    { offset: 15, title: "Caminhos que Não Conhecemos",    verse: "Ensinar-te-ei e instruir-te-ei no caminho que deves seguir; os meus olhos estarão sobre ti.", verseRef: "Salmos 32:8", theme: "Propósito", audioDuration: 315 },
    { offset: 16, title: "A Oração dos Justo",             verse: "A oração do justo tem grande poder em seus efeitos.",                              verseRef: "Tiago 5:16",          theme: "Oração",          audioDuration: 300 },
    { offset: 17, title: "Novo a Cada Dia",                verse: "Se alguém está em Cristo, é nova criatura. As coisas antigas já passaram; eis que se tornaram novas.", verseRef: "2 Coríntios 5:17", theme: "Renovação", audioDuration: 335 },
    { offset: 18, title: "O Senhor Está Perto",            verse: "O Senhor está perto de todos os que o invocam, de todos os que o invocam em verdade.", verseRef: "Salmos 145:18",  theme: "Presença de Deus", audioDuration: 310 },
    { offset: 19, title: "Aguardando com Esperança",       verse: "Aguarda o Senhor! Tem bom ânimo e ele fortalecerá o teu coração.",                 verseRef: "Salmos 27:14",        theme: "Esperança",       audioDuration: 325 },
    { offset: 20, title: "Amor ao Próximo",                verse: "Amarás o teu próximo como a ti mesmo.",                                            verseRef: "Marcos 12:31",        theme: "Amor",            audioDuration: 295 },
    { offset: 21, title: "Gratidão em Tudo",               verse: "Em tudo dai graças, porque esta é a vontade de Deus em Cristo Jesus para convosco.", verseRef: "1 Tessalonicenses 5:18", theme: "Gratidão",  audioDuration: 305 },
    { offset: 22, title: "Fé que Move Montanhas",          verse: "Se tiverdes fé como um grão de mostarda, direis a este monte: transporta-te daqui para acolá, e ele se transportará.", verseRef: "Mateus 17:20", theme: "Fé", audioDuration: 340 },
  ];

  let devotional = null;
  for (const d of devotionalsData) {
    const date = day(d.offset);
    const upserted = await prisma.devotional.upsert({
      where: { date },
      update: {},
      create: { date, title: d.title, verse: d.verse, verseRef: d.verseRef, theme: d.theme, audioDuration: d.audioDuration },
    });
    if (d.offset === 0) devotional = upserted;
  }
  devotional = devotional!;

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

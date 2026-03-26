import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEVOCIONAIS = [
  { title: "A Paz que Excede Todo Entendimento", verseRef: "Fp 4:7", verse: "E a paz de Deus, que excede todo o entendimento, guardará os vossos corações e os vossos pensamentos em Cristo Jesus.", theme: "Paz" },
  { title: "Força Renovada em Deus", verseRef: "Is 40:31", verse: "Mas os que esperam no Senhor renovarão as suas forças, subirão com asas como águias, correrão e não se cansarão, caminharão e não se fatigarão.", theme: "Força" },
  { title: "Confie em Deus de Todo o Seu Coração", verseRef: "Pv 3:5-6", verse: "Confie no Senhor de todo o seu coração e não se apoie em seu próprio entendimento; reconheça-o em todos os seus caminhos, e ele endireitará as suas veredas.", theme: "Confiança" },
  { title: "Deus Cuida de Você", verseRef: "1 Pe 5:7", verse: "Lançai sobre ele toda a vossa ansiedade, porque ele tem cuidado de vós.", theme: "Cuidado" },
  { title: "Novo a Cada Manhã", verseRef: "Lm 3:22-23", verse: "As misericórdias do Senhor não têm fim! Suas compaixões jamais se esgotam. Renovam-se a cada manhã; grande é a tua fidelidade.", theme: "Fidelidade" },
  { title: "Tudo Posso em Cristo", verseRef: "Fp 4:13", verse: "Tudo posso naquele que me fortalece.", theme: "Força" },
  { title: "Planos de Bem e não de Mal", verseRef: "Jr 29:11", verse: "Porque sou eu que conheço os planos que tenho para vocês, diz o Senhor, planos de fazê-los prosperar e não de causar dano, planos de dar a vocês esperança e um futuro.", theme: "Esperança" },
  { title: "O Senhor é Meu Pastor", verseRef: "Sl 23:1", verse: "O Senhor é o meu pastor; nada me faltará.", theme: "Provisão" },
  { title: "Amor Incondicional", verseRef: "Jo 3:16", verse: "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.", theme: "Amor" },
  { title: "Busque Primeiro o Reino", verseRef: "Mt 6:33", verse: "Mas busquem em primeiro lugar o reino de Deus e a sua justiça, e todas essas coisas lhes serão acrescentadas.", theme: "Prioridades" },
  { title: "Permaneça na Videira", verseRef: "Jo 15:5", verse: "Eu sou a videira; vocês são os ramos. Se alguém permanecer em mim e eu nele, esse dará muito fruto; sem mim, vocês não podem fazer coisa alguma.", theme: "Oração" },
  { title: "Deus é Nosso Refúgio", verseRef: "Sl 46:1", verse: "Deus é o nosso refúgio e a nossa força, socorro bem presente nas tribulações.", theme: "Proteção" },
  { title: "Andar pela Fé", verseRef: "2 Co 5:7", verse: "Porque andamos por fé e não por vista.", theme: "Fé" },
  { title: "Gratidão em Tudo", verseRef: "1 Ts 5:18", verse: "Deem graças em todas as circunstâncias, pois esta é a vontade de Deus para vocês em Cristo Jesus.", theme: "Gratidão" },
  { title: "Luz e Sal do Mundo", verseRef: "Mt 5:14", verse: "Vocês são a luz do mundo. Não se pode esconder uma cidade construída sobre um monte.", theme: "Propósito" },
  { title: "Oração que Transforma", verseRef: "Tg 5:16", verse: "A oração de um justo é poderosa e eficaz.", theme: "Oração" },
  { title: "Firme e Inabalável", verseRef: "1 Co 15:58", verse: "Portanto, meus amados irmãos, sede firmes e constantes, sempre abundantes na obra do Senhor, sabendo que o vosso trabalho não é vão no Senhor.", theme: "Perseverança" },
  { title: "A Bondade de Deus", verseRef: "Sl 34:8", verse: "Experimentai e vede que o Senhor é bom; bem-aventurado o homem que nele confia.", theme: "Gratidão" },
  { title: "Renovados pela Palavra", verseRef: "Rm 12:2", verse: "Não se conformem com o padrão deste mundo, mas transformem-se pela renovação da sua mente, para que sejam capazes de experimentar e comprovar a boa, agradável e perfeita vontade de Deus.", theme: "Transformação" },
  { title: "O Amor de Deus Permanece", verseRef: "Rm 8:38-39", verse: "Porque estou convencido de que nem morte, nem vida, nem anjos, nem principados, nem o presente, nem o futuro, nem poderes, nem altura, nem profundidade, nem qualquer outra coisa na criação será capaz de nos separar do amor de Deus.", theme: "Amor" },
  { title: "Liberdade em Cristo", verseRef: "Gl 5:1", verse: "Foi para a liberdade que Cristo nos libertou. Portanto, permaneçam firmes e não se deixem submeter novamente ao jugo da escravidão.", theme: "Liberdade" },
  { title: "Guarda o Coração", verseRef: "Pv 4:23", verse: "Acima de tudo, guarda o teu coração, pois dele procedem as fontes da vida.", theme: "Santidade" },
  { title: "Alegria Completa", verseRef: "Jo 15:11", verse: "Disse-lhes estas coisas para que a minha alegria esteja em vocês e a alegria de vocês seja completa.", theme: "Alegria" },
  { title: "Chegar Perto de Deus", verseRef: "Tg 4:8", verse: "Chegai-vos a Deus, e ele se chegará a vós.", theme: "Oração" },
  { title: "Provisão Divina", verseRef: "Fp 4:19", verse: "O meu Deus suprirá todas as suas necessidades de acordo com as suas gloriosas riquezas em Cristo Jesus.", theme: "Provisão" },
  { title: "Perdão que Liberta", verseRef: "Ef 4:32", verse: "Sejam bondosos e compassivos uns para com os outros, perdoando-se mutuamente, assim como Deus os perdoou em Cristo.", theme: "Perdão" },
  { title: "Esperança que não Decepciona", verseRef: "Rm 5:5", verse: "E a esperança não nos decepciona, porque Deus derramou seu amor em nossos corações, por meio do Espírito Santo que ele nos deu.", theme: "Esperança" },
  { title: "Humildade Diante de Deus", verseRef: "Mq 6:8", verse: "Ele te declarou, ó homem, o que é bom; e que é o que o Senhor pede de ti, senão que pratiques a justiça, ames a misericórdia e andes humildemente com o teu Deus?", theme: "Humildade" },
  { title: "O Espírito nos Ajuda", verseRef: "Rm 8:26", verse: "Da mesma forma, o Espírito nos ajuda em nossa fraqueza. Não sabemos pelo que orar, mas o próprio Espírito intercede por nós com gemidos inexprimíveis.", theme: "Oração" },
  { title: "Vivendo para Glorificar a Deus", verseRef: "1 Co 10:31", verse: "Portanto, quer comam, quer bebam, quer façam qualquer outra coisa, façam tudo para a glória de Deus.", theme: "Propósito" },
];

async function main() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let created = 0;
  let skipped = 0;

  for (let i = 0; i < DEVOCIONAIS.length; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);

    const existing = await prisma.devotional.findFirst({
      where: { date: { gte: date, lt: new Date(date.getTime() + 86400000) } },
    });

    if (existing) { skipped++; continue; }

    await prisma.devotional.create({
      data: {
        date,
        title: DEVOCIONAIS[i].title,
        verse: DEVOCIONAIS[i].verse,
        verseRef: DEVOCIONAIS[i].verseRef,
        theme: DEVOCIONAIS[i].theme,
      },
    });
    created++;
  }

  console.log(`✓ ${created} devocionais criados, ${skipped} já existiam.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

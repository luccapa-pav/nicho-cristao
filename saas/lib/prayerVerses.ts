export type PrayerMode = "Livre" | "Adoração" | "Intercessão" | "Lectio Divina";

export const PRAYER_VERSES: Record<PrayerMode, Array<{ verse: string; ref: string }>> = {
  "Livre": [
    { verse: "Apresentai os vossos pedidos a Deus em toda a oração e súplica, com ação de graças.", ref: "Filipenses 4:6" },
    { verse: "Sede constantes na oração, velando nela com ações de graças.", ref: "Colossenses 4:2" },
    { verse: "Confessai as vossas culpas uns aos outros e orai uns pelos outros, para serdes curados.", ref: "Tiago 5:16" },
    { verse: "Pedi e dar-se-vos-á; buscai e achareis; batei e abrir-se-vos-á.", ref: "Mateus 7:7" },
  ],
  "Adoração": [
    { verse: "Cantai ao Senhor um cântico novo; cantai ao Senhor toda a terra!", ref: "Salmos 96:1" },
    { verse: "O Senhor é grande e muito digno de louvor; a sua grandeza é insondável.", ref: "Salmos 145:3" },
    { verse: "Bendize, ó minha alma, ao Senhor, e tudo o que há em mim bendiga o seu santo nome.", ref: "Salmos 103:1" },
    { verse: "Aclamai ao Senhor toda a terra; cantai, exultai e salmodiai.", ref: "Salmos 98:4" },
  ],
  "Intercessão": [
    { verse: "Exorto, antes de tudo, que se façam súplicas, orações, intercessões e ações de graças por todos os homens.", ref: "1 Timóteo 2:1" },
    { verse: "Orai em todo tempo no Espírito, com toda a oração e súplica.", ref: "Efésios 6:18" },
    { verse: "Por isso, intercedo por vós, para que o Deus do nosso Senhor Jesus Cristo, o Pai da glória, vos conceda espírito de sabedoria.", ref: "Efésios 1:16-17" },
    { verse: "Confiai nele em todo o tempo, ó povo; derramai diante dele o vosso coração.", ref: "Salmos 62:8" },
  ],
  "Lectio Divina": [
    { verse: "A tua palavra é uma lâmpada que ilumina os meus passos e uma luz que clareia o meu caminho.", ref: "Salmos 119:105" },
    { verse: "Não se aparte da tua boca o livro desta lei; antes medita nele dia e noite.", ref: "Josué 1:8" },
    { verse: "Como são doces as tuas palavras ao meu paladar! Mais do que o mel à minha boca.", ref: "Salmos 119:103" },
    { verse: "Bem-aventurado o homem que não anda no conselho dos ímpios... antes tem o seu prazer na lei do Senhor.", ref: "Salmos 1:1-2" },
  ],
};

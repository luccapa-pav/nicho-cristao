const input = $input.first().json;
const data = input.publishData || input;

const hashtagsStr = (data.hashtags || []).join(' ');
const tema = data.topic && data.topic.milagre_de_jesus ? data.topic.milagre_de_jesus : data.titulo;

// Pergunta de fé baseada no tema
const perguntaDeFe = 'Você já viveu um momento em que só Jesus podia te ajudar? Conta nos comentários! 🙏';

// YouTube — SEO + links das redes + pergunta + compartilhe
const youtubeTitle = (data.titulo + ' #Shorts').substring(0, 100);
const youtubeDescription = [
  data.titulo,
  '',
  data.descricao,
  '',
  '💬 ' + perguntaDeFe,
  '',
  '🔁 Compartilhe com alguém que precisa ver isso hoje!',
  '',
  '📲 Nos siga também:',
  '🎵 TikTok: tiktok.com/@viver.em.jesus0',
  '📸 Instagram: instagram.com/viver.em.jesus',
  '',
  hashtagsStr + ' #BibliaSagrada #Shorts #Jesus #Cristão #FéEmDeus'
].join('\n');

// Instagram — emocional + pergunta + compartilhe + hashtags
const instagramCaption = [
  data.titulo,
  '',
  data.descricao,
  '',
  '💬 ' + perguntaDeFe,
  '',
  '🔁 Compartilhe com quem precisa de fé hoje!',
  '',
  hashtagsStr + ' #Jesus #Cristão #FéEmDeus #BibliaSagrada #Shorts #Reels #FeQueTransforma #MilagresDeJesus #VidaCristã #PalavraDeDeus'
].join('\n');

// TikTok — curto + pergunta + compartilhe + poucos hashtags
const tiktokCaption = [
  data.titulo,
  '',
  '💬 ' + perguntaDeFe,
  '',
  '🔁 Compartilhe com quem precisa!',
  '',
  '#Jesus #FéEmDeus #Cristão #Shorts #Milagre'
].join('\n');

return [{
  json: {
    videoId: data.videoId,
    titulo: data.titulo,
    descricao: data.descricao,
    hashtags: data.hashtags || [],
    narracao: data.narracao,
    topic: data.topic,
    publicVideoUrl: data.renderUrl || data.outputPath,
    youtubeTitle,
    youtubeDescription,
    instagramCaption,
    tiktokCaption,
    // manter caption genérica como fallback
    caption: instagramCaption,
    hashtagsStr,
    YOUTUBE_CLIENT_ID: input.YOUTUBE_CLIENT_ID,
    YOUTUBE_CLIENT_SECRET: input.YOUTUBE_CLIENT_SECRET,
    YOUTUBE_REFRESH_TOKEN: input.YOUTUBE_REFRESH_TOKEN
  }
}];

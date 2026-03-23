const https = require('https');
const data = $input.first().json;

const WEBHOOK_URL = data.DISCORD_WEBHOOK_URL;
if (!WEBHOOK_URL) throw new Error('DISCORD_WEBHOOK_URL não configurado no node Set Credentials');

function discordPost(url, payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const parsed = new URL(url);
    const req = https.request({
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, text: Buffer.concat(chunks).toString() }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

// Msg 1 — vídeo
await discordPost(WEBHOOK_URL, {
  content: [
    '🎬 **' + data.titulo + '**',
    '',
    '🎥 **Vídeo:** ' + data.publicVideoUrl,
    '📁 ID: `' + data.videoId + '`'
  ].join('\n')
});
await delay(600);

// Msg 2 — YouTube
const ytContent = [
  '**📺 YOUTUBE**',
  '**Título:**',
  '```',
  data.youtubeTitle,
  '```',
  '**Descrição:**',
  '```',
  (data.youtubeDescription || '').substring(0, 1800),
  '```'
].join('\n');
await discordPost(WEBHOOK_URL, { content: ytContent.substring(0, 2000) });
await delay(600);

// Msg 3 — Instagram
const igContent = [
  '**📸 INSTAGRAM**',
  '**Legenda:**',
  '```',
  (data.instagramCaption || '').substring(0, 1800),
  '```'
].join('\n');
await discordPost(WEBHOOK_URL, { content: igContent.substring(0, 2000) });
await delay(600);

// Msg 4 — TikTok
const ttContent = [
  '**🎵 TIKTOK**',
  '**Legenda:**',
  '```',
  (data.tiktokCaption || '').substring(0, 1800),
  '```'
].join('\n');
await discordPost(WEBHOOK_URL, { content: ttContent.substring(0, 2000) });

return [{ json: { videoId: data.videoId, discordNotified: true, status: 'notified' } }];

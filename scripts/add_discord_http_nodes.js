const https = require('https');

const N8N_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzM2QzZDk5YS00NjMyLTQyMmItOTZkZi03ZTc5M2Y5YzMwZjUiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiY2RlNzMzM2MtMTJlMS00ZmJjLWE0OTItZDJhYjVkM2U5ZGE1IiwiaWF0IjoxNzczMTkwOTA0fQ.DI0te7DG89FQOywg1jdXRGbsV8udA-NuaEK88nvIYBs';
const WEBHOOK = 'https://discord.com/api/webhooks/1484275582022979707/JSSIq5BDLtxM14PLhrv7w09yF-MuqLLRId76Gz-A_SxX1crMW9rMdyWmQtlYGQsd4PCf';

function n8nReq(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: 'n8n-n8n.yjlhot.easypanel.host', path, method,
      headers: { 'X-N8N-API-KEY': N8N_KEY, 'Content-Type': 'application/json' }
    };
    if (data) opts.headers['Content-Length'] = Buffer.byteLength(data);
    let out = '';
    const req = https.request(opts, res => {
      res.on('data', d => out += d);
      res.on('end', () => { try { resolve({ status: res.statusCode, body: JSON.parse(out) }); } catch(e) { resolve({ status: res.statusCode, body: out }); } });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function httpNode(id, name, expr, posX, posY) {
  return {
    id,
    name,
    type: 'n8n-nodes-base.httpRequest',
    position: [posX, posY],
    parameters: {
      method: 'POST',
      url: WEBHOOK,
      sendBody: true,
      specifyBody: 'json',
      jsonBody: '={"content": {{ ' + expr + ' }}}',
      options: {}
    }
  };
}

const P = "$('Preparar Legendas').first().json";

const NODES = [
  httpNode(
    'discord-video', 'Discord: Vídeo',
    `JSON.stringify("🎬 **" + ${P}.titulo + "**\\n\\n🎥 Vídeo: " + ${P}.publicVideoUrl)`,
    760, 100
  ),
  httpNode(
    'discord-youtube', 'Discord: YouTube',
    `JSON.stringify("📺 YOUTUBE\\n\\nTítulo:\\n" + ${P}.youtubeTitle + "\\n\\nDescrição:\\n" + (${P}.youtubeDescription || '').substring(0, 1900))`,
    760, 240
  ),
  httpNode(
    'discord-instagram', 'Discord: Instagram',
    `JSON.stringify("📸 INSTAGRAM\\n\\n" + (${P}.instagramCaption || '').substring(0, 1900))`,
    760, 380
  ),
  httpNode(
    'discord-tiktok', 'Discord: TikTok',
    `JSON.stringify("🎵 TIKTOK\\n\\n" + (${P}.tiktokCaption || '').substring(0, 1900))`,
    760, 520
  )
];

async function main() {
  const wf = (await n8nReq('GET', '/api/v1/workflows/SKUBGveT9qeXFNEW')).body;

  // Remover nodes Discord antigos
  wf.nodes = wf.nodes.filter(n => !['node-discord-notify', 'discord-video', 'discord-youtube', 'discord-instagram', 'discord-tiktok'].includes(n.id));

  // Remover conexões antigas de Discord
  delete wf.connections['Notificar Discord'];
  delete wf.connections['Discord: Vídeo'];
  delete wf.connections['Discord: YouTube'];
  delete wf.connections['Discord: Instagram'];

  // Adicionar 4 nodes
  NODES.forEach(n => wf.nodes.push(n));

  // Conexões: Preparar Legendas → Discord:Vídeo → YouTube → Instagram → TikTok
  if (!wf.connections['Preparar Legendas']) wf.connections['Preparar Legendas'] = { main: [[]] };
  if (!wf.connections['Preparar Legendas'].main[0]) wf.connections['Preparar Legendas'].main[0] = [];
  // Remover conexão antiga ao Notificar Discord
  wf.connections['Preparar Legendas'].main[0] = wf.connections['Preparar Legendas'].main[0]
    .filter(c => c.node !== 'Notificar Discord');
  // Adicionar conexão ao primeiro node Discord
  wf.connections['Preparar Legendas'].main[0].push({ node: 'Discord: Vídeo', type: 'main', index: 0 });

  wf.connections['Discord: Vídeo']    = { main: [[{ node: 'Discord: YouTube',   type: 'main', index: 0 }]] };
  wf.connections['Discord: YouTube']  = { main: [[{ node: 'Discord: Instagram', type: 'main', index: 0 }]] };
  wf.connections['Discord: Instagram']= { main: [[{ node: 'Discord: TikTok',    type: 'main', index: 0 }]] };
  wf.connections['Discord: TikTok']   = { main: [[{ node: 'Registrar Publicação', type: 'main', index: 0 }]] };

  const res = await n8nReq('PUT', '/api/v1/workflows/SKUBGveT9qeXFNEW', {
    name: wf.name, nodes: wf.nodes, connections: wf.connections, settings: wf.settings
  });

  console.log('Status:', res.status);
  if (res.status === 200) {
    const names = res.body.nodes.map(n => n.name);
    console.log('Nodes Discord:', names.filter(n => n.startsWith('Discord')));
    console.log('Total nodes:', res.body.nodes.length);
  } else {
    console.log('Erro:', JSON.stringify(res.body).substring(0, 400));
  }
}

main().catch(e => console.error(e.message));

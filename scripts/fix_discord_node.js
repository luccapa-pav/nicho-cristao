const https = require('https');

const N8N_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzM2QzZDk5YS00NjMyLTQyMmItOTZkZi03ZTc5M2Y5YzMwZjUiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiY2RlNzMzM2MtMTJlMS00ZmJjLWE0OTItZDJhYjVkM2U5ZGE1IiwiaWF0IjoxNzczMTkwOTA0fQ.DI0te7DG89FQOywg1jdXRGbsV8udA-NuaEK88nvIYBs';

// URL hardcoded para evitar que n8n transforme a expressão
const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1484275582022979707/JSSIq5BDLtxM14PLhrv7w09yF-MuqLLRId76Gz-A_SxX1crMW9rMdyWmQtlYGQsd4PCf';

const CODE_LINES = [
  "const https = require('https');",
  "const data = $input.first().json;",
  "",
  "const WEBHOOK_URL = '" + DISCORD_WEBHOOK_URL + "';",
  "",
  "function discordPost(url, payload) {",
  "  return new Promise((resolve, reject) => {",
  "    const body = JSON.stringify(payload);",
  "    const parsed = new URL(url);",
  "    const req = https.request({",
  "      hostname: parsed.hostname,",
  "      path: parsed.pathname + parsed.search,",
  "      method: 'POST',",
  "      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }",
  "    }, res => {",
  "      const chunks = [];",
  "      res.on('data', c => chunks.push(c));",
  "      res.on('end', () => resolve({ status: res.statusCode, text: Buffer.concat(chunks).toString() }));",
  "    });",
  "    req.on('error', reject);",
  "    req.write(body);",
  "    req.end();",
  "  });",
  "}",
  "",
  "function delay(ms) { return new Promise(r => setTimeout(r, ms)); }",
  "",
  "// Msg 1 — video",
  "await discordPost(WEBHOOK_URL, {",
  "  content: '\\u{1F3AC} **' + data.titulo + '**\\n\\n\\u{1F3A5} **V\\u00EDdeo:** ' + data.publicVideoUrl + '\\n\\u{1F4C1} ID: `' + data.videoId + '`'",
  "});",
  "await delay(600);",
  "",
  "// Msg 2 — YouTube",
  "const ytContent = '**\\u{1F4FA} YOUTUBE**\\n**T\\u00EDtulo:**\\n```\\n' + data.youtubeTitle + '\\n```\\n**Descri\\u00E7\\u00E3o:**\\n```\\n' + (data.youtubeDescription || '').substring(0, 1800) + '\\n```';",
  "await discordPost(WEBHOOK_URL, { content: ytContent.substring(0, 2000) });",
  "await delay(600);",
  "",
  "// Msg 3 — Instagram",
  "const igContent = '**\\u{1F4F8} INSTAGRAM**\\n**Legenda:**\\n```\\n' + (data.instagramCaption || '').substring(0, 1800) + '\\n```';",
  "await discordPost(WEBHOOK_URL, { content: igContent.substring(0, 2000) });",
  "await delay(600);",
  "",
  "// Msg 4 — TikTok",
  "const ttContent = '**\\u{1F3B5} TIKTOK**\\n**Legenda:**\\n```\\n' + (data.tiktokCaption || '').substring(0, 1800) + '\\n```';",
  "await discordPost(WEBHOOK_URL, { content: ttContent.substring(0, 2000) });",
  "",
  "return [{ json: { videoId: data.videoId, discordNotified: true, status: 'notified' } }];"
];

const NEW_CODE = CODE_LINES.join('\n');

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

async function main() {
  const wf = (await n8nReq('GET', '/api/v1/workflows/SKUBGveT9qeXFNEW')).body;
  const node = wf.nodes.find(n => n.id === 'node-discord-notify');
  node.parameters.jsCode = NEW_CODE;

  const res = await n8nReq('PUT', '/api/v1/workflows/SKUBGveT9qeXFNEW', {
    name: wf.name, nodes: wf.nodes, connections: wf.connections, settings: wf.settings
  });

  console.log('Status:', res.status);
  if (res.status === 200) {
    const saved = res.body.nodes.find(n => n.id === 'node-discord-notify').parameters.jsCode;
    console.log('URL presente:', saved.includes('discord.com/api/webhooks'));
    console.log('Sem transformacao errada:', !saved.includes("data.('"));
    console.log('\nPrimeiras 5 linhas:');
    console.log(saved.split('\n').slice(0, 5).join('\n'));
  } else {
    console.log('Erro:', JSON.stringify(res.body).substring(0, 400));
  }
}

main().catch(e => console.error(e.message));

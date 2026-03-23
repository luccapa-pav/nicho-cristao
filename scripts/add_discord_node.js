const https = require('https');
const fs = require('fs');
const path = require('path');

const N8N_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzM2QzZDk5YS00NjMyLTQyMmItOTZkZi03ZTc5M2Y5YzMwZjUiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiY2RlNzMzM2MtMTJlMS00ZmJjLWE0OTItZDJhYjVkM2U5ZGE1IiwiaWF0IjoxNzczMTkwOTA0fQ.DI0te7DG89FQOywg1jdXRGbsV8udA-NuaEK88nvIYBs';
const DISCORD_WEBHOOK_URL = process.argv[2];

if (!DISCORD_WEBHOOK_URL) {
  console.error('Uso: node add_discord_node.js <DISCORD_WEBHOOK_URL>');
  process.exit(1);
}

const DISCORD_CODE = fs.readFileSync(path.join(__dirname, 'discord_notify_code.js'), 'utf8');

function n8nReq(method, reqPath, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: 'n8n-n8n.yjlhot.easypanel.host', path: reqPath, method,
      headers: { 'X-N8N-API-KEY': N8N_KEY, 'Content-Type': 'application/json' }
    };
    if (data) opts.headers['Content-Length'] = Buffer.byteLength(data);
    let out = '';
    const req = https.request(opts, res => {
      res.on('data', d => out += d);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(out) }); }
        catch(e) { resolve({ status: res.statusCode, body: out }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function main() {
  const wf = (await n8nReq('GET', '/api/v1/workflows/SKUBGveT9qeXFNEW')).body;

  // 1. Atualizar Set Credentials para incluir DISCORD_WEBHOOK_URL
  const setNode = wf.nodes.find(n => n.id === 'node-set-credentials');
  if (setNode) {
    const assignments = setNode.parameters.assignments.assignments;
    // Remove se já existir para evitar duplicata
    const filtered = assignments.filter(a => a.name !== 'DISCORD_WEBHOOK_URL');
    filtered.push({
      id: 'discord-webhook-url',
      name: 'DISCORD_WEBHOOK_URL',
      value: DISCORD_WEBHOOK_URL,
      type: 'string'
    });
    setNode.parameters.assignments.assignments = filtered;
    console.log('Set Credentials atualizado com DISCORD_WEBHOOK_URL');
  } else {
    console.warn('Node Set Credentials não encontrado — adicione DISCORD_WEBHOOK_URL manualmente');
  }

  // 2. Remover node de discord se já existir (para reaplicar limpo)
  wf.nodes = wf.nodes.filter(n => n.id !== 'node-discord-notify');

  // 3. Adicionar node Discord: Notify
  wf.nodes.push({
    parameters: { jsCode: DISCORD_CODE },
    id: 'node-discord-notify',
    name: 'Discord: Notify',
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position: [760, 300],
    continueOnFail: false
  });
  console.log('Node Discord: Notify adicionado');

  // 4. Conectar Prepare Publish Data → Discord: Notify
  if (!wf.connections['Prepare Publish Data']) {
    wf.connections['Prepare Publish Data'] = { main: [[]] };
  }
  // Garantir que o array existe
  if (!wf.connections['Prepare Publish Data'].main) {
    wf.connections['Prepare Publish Data'].main = [[]];
  }
  if (!wf.connections['Prepare Publish Data'].main[0]) {
    wf.connections['Prepare Publish Data'].main[0] = [];
  }
  // Remover conexão antiga ao Discord se existir
  wf.connections['Prepare Publish Data'].main[0] = wf.connections['Prepare Publish Data'].main[0]
    .filter(c => c.node !== 'Discord: Notify');
  wf.connections['Prepare Publish Data'].main[0].push({
    node: 'Discord: Notify', type: 'main', index: 0
  });

  // 5. Salvar
  const res = await n8nReq('PUT', '/api/v1/workflows/SKUBGveT9qeXFNEW', {
    name: wf.name,
    nodes: wf.nodes,
    connections: wf.connections,
    settings: wf.settings
  });

  console.log('Status:', res.status);
  if (res.status === 200) {
    const nodes = res.body.nodes;
    const discordNode = nodes.find(n => n.id === 'node-discord-notify');
    console.log('Discord node salvo:', !!discordNode);
    console.log('Code preview:', discordNode ? discordNode.parameters.jsCode.substring(0, 60) : 'N/A');
    console.log('Total nodes:', nodes.length);
  } else {
    console.log('Erro:', JSON.stringify(res.body).substring(0, 500));
  }
}

main().catch(e => console.error(e.message));

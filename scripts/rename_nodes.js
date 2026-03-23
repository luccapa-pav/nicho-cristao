const https = require('https');

const N8N_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzM2QzZDk5YS00NjMyLTQyMmItOTZkZi03ZTc5M2Y5YzMwZjUiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiY2RlNzMzM2MtMTJlMS00ZmJjLWE0OTItZDJhYjVkM2U5ZGE1IiwiaWF0IjoxNzczMTkwOTA0fQ.DI0te7DG89FQOywg1jdXRGbsV8udA-NuaEK88nvIYBs';

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

// Renomeia nodes e atualiza todas as referências nas connections
function applyRenames(wf, renames) {
  // 1. Renomear nos nodes
  wf.nodes.forEach(n => {
    if (renames[n.name]) {
      console.log('  Renomeando:', n.name, '→', renames[n.name]);
      n.name = renames[n.name];
    }
  });

  // 2. Atualizar connections (chaves e targets)
  const newConn = {};
  Object.entries(wf.connections).forEach(([key, val]) => {
    const newKey = renames[key] || key;
    // Atualizar targets dentro de cada saída
    const newVal = JSON.parse(JSON.stringify(val)); // deep clone
    if (newVal.main) {
      newVal.main = newVal.main.map(outputs =>
        (outputs || []).map(conn => ({
          ...conn,
          node: renames[conn.node] || conn.node
        }))
      );
    }
    newConn[newKey] = newVal;
  });
  wf.connections = newConn;
}

async function main() {
  // ── MAIN WORKFLOW ──────────────────────────────────────────────────────────
  const wf1 = (await n8nReq('GET', '/api/v1/workflows/zloYjCYLVf6BWhF9')).body;

  const mainRenames = {
    "Call 'SUB: Publishing (YouTube + Instagram + TikTok)'": 'Sub: Publicação',
    "Sub: Generate Videos/Images1": 'Sub: Gerar Vídeos'
  };
  applyRenames(wf1, mainRenames);

  const res1 = await n8nReq('PUT', '/api/v1/workflows/zloYjCYLVf6BWhF9', {
    name: wf1.name, nodes: wf1.nodes, connections: wf1.connections, settings: wf1.settings
  });
  console.log('Main workflow:', res1.status === 200 ? 'OK' : 'ERRO ' + res1.status);
  if (res1.status !== 200) console.log(JSON.stringify(res1.body).substring(0, 300));

  // ── PUBLISHING WORKFLOW ────────────────────────────────────────────────────
  const wf2 = (await n8nReq('GET', '/api/v1/workflows/SKUBGveT9qeXFNEW')).body;

  const pubRenames = {
    'Set Credentials':          'Injetar Credenciais',
    'Prepare Publish Data':     'Preparar Legendas',
    'YouTube: Upload':          'YouTube (manual)',
    'Instagram: Create Container': 'Instagram: Container (manual)',
    'Wait Instagram Processing': 'Aguardar Instagram (manual)',
    'Instagram: Publish Reel':  'Instagram: Publicar (manual)',
    'TikTok Upload':            'TikTok (manual)',
    'Collect Publish Results':  'Registrar Publicação',
    'Discord: Notify':          'Notificar Discord'
  };
  applyRenames(wf2, pubRenames);

  const res2 = await n8nReq('PUT', '/api/v1/workflows/SKUBGveT9qeXFNEW', {
    name: wf2.name, nodes: wf2.nodes, connections: wf2.connections, settings: wf2.settings
  });
  console.log('Publishing workflow:', res2.status === 200 ? 'OK' : 'ERRO ' + res2.status);
  if (res2.status !== 200) console.log(JSON.stringify(res2.body).substring(0, 300));

  if (res1.status === 200 && res2.status === 200) {
    console.log('\nTodos os nodes renomeados com sucesso.');
  }
}

main().catch(e => console.error(e.message));

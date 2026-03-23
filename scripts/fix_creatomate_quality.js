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

async function main() {
  console.log('Buscando workflow zloYjCYLVf6BWhF9...');
  const wf = (await n8nReq('GET', '/api/v1/workflows/zloYjCYLVf6BWhF9')).body;

  const node = wf.nodes.find(n => n.id === 'node-ffmpeg-assemble');
  if (!node) throw new Error('node-ffmpeg-assemble não encontrado');
  console.log('Node encontrado:', node.name);

  // Atualizar resolução de 720x1280 para 1080x1920 (Full HD vertical)
  const oldCode = node.parameters.jsCode;
  let newCode = oldCode;

  // Substituir width e height no objeto source
  newCode = newCode
    .replace(/width:\s*720/, 'width: 1080')
    .replace(/height:\s*1280/, 'height: 1920');

  if (newCode === oldCode) {
    console.log('AVISO: Nenhuma substituição foi feita. Verificando padrões no código...');
    const widthMatch = oldCode.match(/width:\s*\d+/g);
    const heightMatch = oldCode.match(/height:\s*\d+/g);
    console.log('Padrões width encontrados:', widthMatch);
    console.log('Padrões height encontrados:', heightMatch);
  } else {
    // Verificar que a substituição foi aplicada
    const hasNewWidth = newCode.includes('width: 1080');
    const hasNewHeight = newCode.includes('height: 1920');
    console.log('width: 1080 presente:', hasNewWidth);
    console.log('height: 1920 presente:', hasNewHeight);

    node.parameters.jsCode = newCode;

    const res = await n8nReq('PUT', '/api/v1/workflows/zloYjCYLVf6BWhF9', {
      name: wf.name, nodes: wf.nodes, connections: wf.connections, settings: wf.settings
    });
    console.log('Status PUT:', res.status);
    if (res.status !== 200) {
      console.log('Erro:', JSON.stringify(res.body).substring(0, 500));
    } else {
      console.log('OK: Qualidade do Creatomate atualizada para 1080x1920 30fps');
    }
  }
}

main().catch(e => console.error('ERRO:', e.message));

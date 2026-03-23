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
  const wf = (await n8nReq('GET', '/api/v1/workflows/zloYjCYLVf6BWhF9')).body;
  const node = wf.nodes.find(n => n.id === 'node-ffmpeg-assemble');

  const oldRef = "Sub: Generate Videos/Images";
  const newRef = "Sub: Gerar V\u00EDdeos";

  node.parameters.jsCode = node.parameters.jsCode
    .split("'" + oldRef + "'").join("'" + newRef + "'")
    .split('"' + oldRef + '"').join('"' + newRef + '"');

  const refs = [...node.parameters.jsCode.matchAll(/\$\(['"](.+?)['"]\)/g)].map(m => m[1]);
  console.log('Refs no codigo:', refs);

  const res = await n8nReq('PUT', '/api/v1/workflows/zloYjCYLVf6BWhF9', {
    name: wf.name, nodes: wf.nodes, connections: wf.connections, settings: wf.settings
  });
  console.log('Status:', res.status);
  if (res.status !== 200) console.log(JSON.stringify(res.body).substring(0, 300));
}

main().catch(e => console.error(e.message));

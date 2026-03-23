const https = require('https');
const fs = require('fs');
const path = require('path');

const N8N_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzM2QzZDk5YS00NjMyLTQyMmItOTZkZi03ZTc5M2Y5YzMwZjUiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiY2RlNzMzM2MtMTJlMS00ZmJjLWE0OTItZDJhYjVkM2U5ZGE1IiwiaWF0IjoxNzczMTkwOTA0fQ.DI0te7DG89FQOywg1jdXRGbsV8udA-NuaEK88nvIYBs';
const SCRIPTS_DIR = path.dirname(__filename);
const NEW_CODE = fs.readFileSync(path.join(SCRIPTS_DIR, 'new_assemble_code.js'), 'utf8');

function n8nRequest(method, apiPath, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: 'n8n-n8n.yjlhot.easypanel.host',
      path: apiPath,
      method,
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
  // Fetch fresh workflow
  console.log('Fetching workflow...');
  const getRes = await n8nRequest('GET', '/api/v1/workflows/zloYjCYLVf6BWhF9', null);
  if (getRes.status !== 200) throw new Error('GET failed: ' + getRes.status + ' ' + JSON.stringify(getRes.body));
  const wf = getRes.body;
  console.log('Workflow:', wf.name, '| Nodes:', wf.nodes.length);

  // Find and update node
  const nodeIdx = wf.nodes.findIndex(n => n.id === 'node-ffmpeg-assemble');
  if (nodeIdx === -1) throw new Error('node-ffmpeg-assemble not found! IDs: ' + wf.nodes.map(n=>n.id).join(', '));

  wf.nodes[nodeIdx].parameters.jsCode = NEW_CODE;
  console.log('Code updated (' + NEW_CODE.length + ' chars). Pushing...');

  const putRes = await n8nRequest('PUT', '/api/v1/workflows/zloYjCYLVf6BWhF9', wf);
  console.log('PUT status:', putRes.status);

  if (putRes.status === 200) {
    const node = putRes.body.nodes.find(n => n.id === 'node-ffmpeg-assemble');
    const code = node && node.parameters && node.parameters.jsCode;
    console.log('\nSUCCESS!');
    console.log('Code length saved:', code ? code.length : 'N/A');
    console.log('cumulativeTime:', !!(code && code.includes('cumulativeTime')));
    console.log('gradient:', !!(code && code.includes('fill_mode')));
    console.log('karaoke:', !!(code && code.includes('karaoke')));
    console.log('MUSIC_TRACKS:', !!(code && code.includes('MUSIC_TRACKS')));
    console.log('720x1280:', !!(code && code.includes('720')));
    console.log('30 fps:', !!(code && code.includes('30 fps')));
    console.log('/v1/renders:', !!(code && code.includes('/v1/renders')));
  } else {
    console.log('ERROR:', JSON.stringify(putRes.body).substring(0, 1000));
  }
}

main().catch(e => console.error('Fatal:', e.message));

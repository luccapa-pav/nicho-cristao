const https = require('https');

const N8N_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzM2QzZDk5YS00NjMyLTQyMmItOTZkZi03ZTc5M2Y5YzMwZjUiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiY2RlNzMzM2MtMTJlMS00ZmJjLWE0OTItZDJhYjVkM2U5ZGE1IiwiaWF0IjoxNzczMTkwOTA0fQ.DI0te7DG89FQOywg1jdXRGbsV8udA-NuaEK88nvIYBs';

const PREPARE_CODE = [
  'const input = $input.first().json;',
  'const data = input.publishData || input;',
  '',
  'const hashtagsStr = (data.hashtags || []).join(\' \');',
  'const caption = data.titulo + \'\\n\\n\' + data.descricao + \'\\n\\n\' + hashtagsStr + \'\\n\\n#Jesus #Cristão #FéEmDeus #BibliaSagrada #Shorts #Reels\';',
  'const youtubeTitle = (data.titulo + \' #Shorts\').substring(0, 100);',
  '',
  'return [{',
  '  json: {',
  '    videoId: data.videoId,',
  '    titulo: data.titulo,',
  '    descricao: data.descricao,',
  '    hashtags: data.hashtags || [],',
  '    narracao: data.narracao,',
  '    topic: data.topic,',
  '    publicVideoUrl: data.renderUrl || data.outputPath,',
  '    youtubeTitle,',
  '    caption,',
  '    hashtagsStr,',
  '    YOUTUBE_CLIENT_ID: input.YOUTUBE_CLIENT_ID,',
  '    YOUTUBE_CLIENT_SECRET: input.YOUTUBE_CLIENT_SECRET,',
  '    YOUTUBE_REFRESH_TOKEN: input.YOUTUBE_REFRESH_TOKEN',
  '  }',
  '}];'
].join('\n');

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
  const node = wf.nodes.find(n => n.id === 'node-prepare-publish');
  node.parameters.jsCode = PREPARE_CODE;

  const res = await n8nReq('PUT', '/api/v1/workflows/SKUBGveT9qeXFNEW', {
    name: wf.name, nodes: wf.nodes, connections: wf.connections, settings: wf.settings
  });
  console.log('Status:', res.status);
  if (res.status === 200) {
    const saved = res.body.nodes.find(n => n.id === 'node-prepare-publish').parameters.jsCode;
    console.log('Has $input:', saved.includes('$input'));
    console.log('Code preview:', saved.substring(0, 60));
  } else {
    console.log('Erro:', JSON.stringify(res.body).substring(0, 400));
  }
}

main().catch(e => console.error(e.message));

const https = require('https');

const N8N_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzM2QzZDk5YS00NjMyLTQyMmItOTZkZi03ZTc5M2Y5YzMwZjUiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiY2RlNzMzM2MtMTJlMS00ZmJjLWE0OTItZDJhYjVkM2U5ZGE1IiwiaWF0IjoxNzczMTkwOTA0fQ.DI0te7DG89FQOywg1jdXRGbsV8udA-NuaEK88nvIYBs';

function n8nReq(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = { hostname: 'n8n-n8n.yjlhot.easypanel.host', path, method,
      headers: { 'X-N8N-API-KEY': N8N_KEY, 'Content-Type': 'application/json' } };
    if (data) opts.headers['Content-Length'] = Buffer.byteLength(data);
    let out = '';
    const req = https.request(opts, res => { res.on('data', d => out += d); res.on('end', () => { try { resolve({status: res.statusCode, body: JSON.parse(out)}); } catch(e) { resolve({status: res.statusCode, body: out}); } }); });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

// ── Prepare Publish Data ──────────────────────────────────────────────────────
const PREPARE_CODE = `const data = $input.first().json.publishData || $input.first().json;

const hashtagsStr = (data.hashtags || []).join(' ');
const caption = data.titulo + '\\n\\n' + data.descricao + '\\n\\n' + hashtagsStr + '\\n\\n#Jesus #Cristão #FéEmDeus #BibliaSagrada #Shorts #Reels';
const youtubeTitle = (data.titulo + ' #Shorts').substring(0, 100);

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
    caption,
    hashtagsStr
  }
}];`;

// ── YouTube: Upload ───────────────────────────────────────────────────────────
const YOUTUBE_CODE = `const https = require('https');
const data = $input.first().json;

const CLIENT_ID = $env.YOUTUBE_CLIENT_ID;
const CLIENT_SECRET = $env.YOUTUBE_CLIENT_SECRET;
const REFRESH_TOKEN = $env.YOUTUBE_REFRESH_TOKEN;
const videoUrl = data.publicVideoUrl;

if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
  throw new Error('YouTube credentials not set (YOUTUBE_CLIENT_ID / CLIENT_SECRET / REFRESH_TOKEN)');
}

function httpsReq(opts, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(opts, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        resolve({ status: res.statusCode, headers: res.headers, buffer: buf, text: buf.toString() });
      });
    });
    req.on('error', reject);
    req.setTimeout(300000, () => req.destroy(new Error('Timeout')));
    if (body) req.write(body);
    req.end();
  });
}

function downloadUrl(url, redirects) {
  redirects = redirects || 0;
  if (redirects > 5) throw new Error('Too many redirects: ' + url);
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = https.request({
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: 'GET',
      headers: { 'User-Agent': 'Mozilla/5.0' }
    }, res => {
      if ([301, 302, 307, 308].includes(res.statusCode)) {
        return resolve(downloadUrl(res.headers.location, redirects + 1));
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    });
    req.on('error', reject);
    req.setTimeout(300000, () => req.destroy(new Error('Download timeout')));
    req.end();
  });
}

// Step 1: Get access token
const tokenBody = 'grant_type=refresh_token' +
  '&refresh_token=' + encodeURIComponent(REFRESH_TOKEN) +
  '&client_id=' + encodeURIComponent(CLIENT_ID) +
  '&client_secret=' + encodeURIComponent(CLIENT_SECRET);

const tokenRes = await httpsReq({
  hostname: 'oauth2.googleapis.com',
  path: '/token',
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(tokenBody)
  }
}, tokenBody);

const tokenData = JSON.parse(tokenRes.text);
if (!tokenData.access_token) throw new Error('YouTube token failed: ' + tokenRes.text);
const accessToken = tokenData.access_token;

// Step 2: Download video from Creatomate
const videoBuffer = await downloadUrl(videoUrl);
if (!videoBuffer || videoBuffer.length < 1000) {
  throw new Error('Video download failed or too small (' + (videoBuffer ? videoBuffer.length : 0) + ' bytes) from: ' + videoUrl);
}

// Step 3: Initiate resumable upload
const description = data.descricao + '\\n\\n' + data.hashtagsStr + '\\n\\nVersículo bíblico e história de Jesus.\\n\\n#Shorts #Jesus #Cristão #FéEmDeus';
const tags = (data.hashtags || []).map(h => h.replace('#', ''));

const metadata = JSON.stringify({
  snippet: {
    title: data.youtubeTitle,
    description: description,
    tags: tags,
    categoryId: '29',
    defaultLanguage: 'pt-BR'
  },
  status: {
    privacyStatus: 'public',
    selfDeclaredMadeForKids: false,
    notifySubscribers: true
  }
});

const initRes = await httpsReq({
  hostname: 'www.googleapis.com',
  path: '/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + accessToken,
    'Content-Type': 'application/json; charset=UTF-8',
    'Content-Length': Buffer.byteLength(metadata),
    'X-Upload-Content-Type': 'video/mp4',
    'X-Upload-Content-Length': String(videoBuffer.length)
  }
}, metadata);

const uploadUrl = initRes.headers.location;
if (!uploadUrl) throw new Error('No upload URL from YouTube (status ' + initRes.status + '): ' + initRes.text.substring(0, 300));

// Step 4: Upload video
const uploadParsed = new URL(uploadUrl);
const uploadRes = await httpsReq({
  hostname: uploadParsed.hostname,
  path: uploadParsed.pathname + uploadParsed.search,
  method: 'PUT',
  headers: {
    'Content-Type': 'video/mp4',
    'Content-Length': videoBuffer.length
  }
}, videoBuffer);

if (uploadRes.status !== 200 && uploadRes.status !== 201) {
  throw new Error('YouTube upload failed (HTTP ' + uploadRes.status + '): ' + uploadRes.text.substring(0, 400));
}

const yt = JSON.parse(uploadRes.text);
return [{
  json: {
    videoId: data.videoId,
    youtubeId: yt.id,
    youtubeUrl: 'https://www.youtube.com/shorts/' + yt.id,
    status: 'youtube_uploaded'
  }
}];`;

// ── Collect Publish Results ───────────────────────────────────────────────────
const COLLECT_CODE = `const results = {
  youtube: $('YouTube: Upload').first()?.json || { error: 'not executed' },
  instagram: $('Instagram: Publish Reel').first()?.json || { error: 'not executed' },
  tiktok: $('TikTok Upload').first()?.json || { error: 'not executed' }
};

const prevData = $('Prepare Publish Data').first().json;

return [{
  json: {
    videoId: prevData.videoId,
    titulo: prevData.titulo,
    publishResults: results,
    publishedAt: new Date().toISOString(),
    platforms: Object.entries(results)
      .filter(([_, r]) => r && !r.error)
      .map(([p]) => p),
    status: 'published'
  }
}];`;

async function main() {
  const wf = (await n8nReq('GET', '/api/v1/workflows/SKUBGveT9qeXFNEW')).body;

  // Update existing nodes
  wf.nodes.find(n => n.id === 'node-prepare-publish').parameters.jsCode = PREPARE_CODE;
  wf.nodes.find(n => n.id === 'node-collect-results').parameters.jsCode = COLLECT_CODE;

  // Add YouTube Upload node
  const youtubeNode = {
    parameters: { jsCode: YOUTUBE_CODE },
    id: 'node-youtube-upload',
    name: 'YouTube: Upload',
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position: [540, 150],
    continueOnFail: true
  };
  wf.nodes.push(youtubeNode);

  // Update connections:
  // Prepare → [YouTube, Instagram, TikTok] in parallel
  wf.connections['Prepare Publish Data'].main[0].push({
    node: 'YouTube: Upload', type: 'main', index: 0
  });
  // YouTube → Collect Results
  wf.connections['YouTube: Upload'] = {
    main: [[{ node: 'Collect Publish Results', type: 'main', index: 0 }]]
  };

  const res = await n8nReq('PUT', '/api/v1/workflows/SKUBGveT9qeXFNEW', {
    name: wf.name, nodes: wf.nodes, connections: wf.connections, settings: wf.settings
  });

  console.log('Status:', res.status);
  if (res.status === 200) {
    const nodes = res.body.nodes;
    console.log('Prepare code:', !!(nodes.find(n=>n.id==='node-prepare-publish').parameters.jsCode));
    console.log('YouTube node:', !!(nodes.find(n=>n.id==='node-youtube-upload')));
    console.log('Collect updated:', nodes.find(n=>n.id==='node-collect-results').parameters.jsCode.includes('YouTube: Upload'));
    console.log('Total nodes:', nodes.length);
  } else {
    console.log('Erro:', JSON.stringify(res.body).substring(0, 500));
  }
}

main().catch(e => console.error(e.message));

const https = require('https');
const data = $input.first().json;

const CLIENT_ID = data.YOUTUBE_CLIENT_ID;
const CLIENT_SECRET = data.YOUTUBE_CLIENT_SECRET;
const REFRESH_TOKEN = data.YOUTUBE_REFRESH_TOKEN;
const videoUrl = data.publicVideoUrl;

if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
  throw new Error('YouTube credentials missing in flow data');
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
  if (redirects > 5) throw new Error('Too many redirects');
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = https.request({
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: 'GET',
      headers: { 'User-Agent': 'Mozilla/5.0' }
    }, res => {
      if ([301,302,307,308].includes(res.statusCode)) return resolve(downloadUrl(res.headers.location, redirects+1));
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
  headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(tokenBody) }
}, tokenBody);

let tokenData;
try { tokenData = JSON.parse(tokenRes.text); } catch(e) { throw new Error('Token parse error: ' + tokenRes.text.substring(0, 500)); }
if (!tokenData.access_token) throw new Error('YouTube token failed (HTTP ' + tokenRes.status + '): error=' + tokenData.error + ' | ' + tokenData.error_description + ' | full=' + tokenRes.text);
const accessToken = tokenData.access_token;

// Step 2: Download video
const videoBuffer = await downloadUrl(videoUrl);
if (!videoBuffer || videoBuffer.length < 1000) throw new Error('Video download failed (' + (videoBuffer ? videoBuffer.length : 0) + ' bytes)');

// Step 3: Initiate resumable upload
const description = data.descricao + '\n\n' + data.hashtagsStr + '\n\nVersiculo biblico e historia de Jesus.\n\n#Shorts #Jesus #Cristao #FeEmDeus';
const tags = (data.hashtags || []).map(function(h) { return h.replace('#', ''); });

const metadata = JSON.stringify({
  snippet: { title: data.youtubeTitle, description: description, tags: tags, categoryId: '29', defaultLanguage: 'pt-BR' },
  status: { privacyStatus: 'public', selfDeclaredMadeForKids: false, notifySubscribers: true }
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
if (!uploadUrl) throw new Error('No upload URL (status ' + initRes.status + '): ' + initRes.text.substring(0, 300));

// Step 4: Upload video
const uploadParsed = new URL(uploadUrl);
const uploadRes = await httpsReq({
  hostname: uploadParsed.hostname,
  path: uploadParsed.pathname + uploadParsed.search,
  method: 'PUT',
  headers: { 'Content-Type': 'video/mp4', 'Content-Length': videoBuffer.length }
}, videoBuffer);

if (uploadRes.status !== 200 && uploadRes.status !== 201) {
  throw new Error('YouTube upload failed (HTTP ' + uploadRes.status + '): ' + uploadRes.text.substring(0, 400));
}

const yt = JSON.parse(uploadRes.text);
return [{ json: {
  videoId: data.videoId,
  youtubeId: yt.id,
  youtubeUrl: 'https://www.youtube.com/shorts/' + yt.id,
  status: 'youtube_uploaded'
} }];

"""
Fix v6 — 2 changes:
1. Subtitles: stopAt = videoDuration (not scenesDuration) → no subtitles cut off during CTA
2. CTA background: last scene (most glorious) instead of scene index 2
"""
import json, urllib.request, urllib.error, ssl, sys
sys.stdout.reconfigure(encoding='utf-8')

N8N = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzM2QzZDk5YS00NjMyLTQyMmItOTZkZi03ZTc5M2Y5YzMwZjUiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiY2RlNzMzM2MtMTJlMS00ZmJjLWE0OTItZDJhYjVkM2U5ZGE1IiwiaWF0IjoxNzczMTkwOTA0fQ.DI0te7DG89FQOywg1jdXRGbsV8udA-NuaEK88nvIYBs"
CTX = ssl._create_unverified_context()

def get(wf_id):
    req = urllib.request.Request("https://n8n-n8n.yjlhot.easypanel.host/api/v1/workflows/" + wf_id)
    req.add_header("X-N8N-API-KEY", N8N)
    req.add_header("Accept", "application/json")
    with urllib.request.urlopen(req, timeout=30, context=CTX) as r:
        return json.loads(r.read())

def put(wf_id, wf):
    url = "https://n8n-n8n.yjlhot.easypanel.host/api/v1/workflows/" + wf_id
    payload = {"name": wf["name"], "nodes": wf["nodes"], "connections": wf["connections"], "settings": wf.get("settings", {})}
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(url, data=body, method="PUT")
    req.add_header("X-N8N-API-KEY", N8N)
    req.add_header("Content-Type", "application/json; charset=utf-8")
    req.add_header("Accept", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=30, context=CTX) as r:
            return r.status
    except urllib.error.HTTPError as e:
        print("ERRO:", e.code, e.read().decode()[:300])
        return e.code

NEW_FFMPEG_CODE = r"""var childProcess = require('child_process');
var fs2 = require('fs');
var https2 = require('https');
var http2 = require('http');

var allItems = $input.all().map(function(i) { return i.json; });
var imageData = allItems.find(function(d) { return d.scenes && d.scenes.length > 0; }) || {};
var audioData = allItems.find(function(d) { return d.audioUrl; }) || {};

var videoId   = imageData.videoId || audioData.videoId;
var audioUrl  = audioData.audioUrl;
if (!audioUrl) throw new Error('No audioUrl for ' + videoId);

var titulo    = audioData.titulo    || imageData.titulo    || '';
var descricao = audioData.descricao || imageData.descricao || '';
var hashtags  = audioData.hashtags  || imageData.hashtags  || [];
var narracao  = audioData.narracao  || imageData.narracao  || '';
var topic     = audioData.topic     || imageData.topic     || {};
var ctaText   = audioData.ctaText   || imageData.ctaText   || 'Siga e Compartilhe!';

var scenes = (imageData.scenes || [])
  .filter(function(s) { return s.url; })
  .sort(function(a, b) { return (a.numero || 0) - (b.numero || 0); });
if (!scenes.length) throw new Error('No scene URLs for ' + videoId);

var tempDir = '/home/node/.n8n/temp/' + videoId;
fs2.mkdirSync(tempDir, { recursive: true });

function download(fileUrl, destPath) {
  return new Promise(function(resolve, reject) {
    var mod = fileUrl.startsWith('https:') ? https2 : http2;
    var file = fs2.createWriteStream(destPath);
    mod.get(fileUrl, { rejectUnauthorized: false }, function(res) {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        file.close(); fs2.unlinkSync(destPath);
        return download(res.headers.location, destPath).then(resolve).catch(reject);
      }
      res.pipe(file);
      file.on('finish', function() { file.close(resolve); });
      res.on('error', reject);
    }).on('error', function(err) { fs2.unlink(destPath, function(){}); reject(err); });
  });
}

var fontPath = '/home/node/.n8n/temp/Roboto-Bold.ttf';
if (!fs2.existsSync(fontPath)) {
  await download('https://github.com/google/fonts/raw/main/apache/roboto/static/Roboto-Bold.ttf', fontPath);
}

var audioFile = tempDir + '/narration.mp3';
await download(audioUrl, audioFile);

// Medir duracao real do audio
var audioDuration = parseFloat(childProcess.execSync(
  'ffprobe -v quiet -show_entries format=duration -of csv=p=0 "' + audioFile + '"'
).toString().trim()) || 30;

var MUSIC_TRACKS = [
  'https://cdn.pixabay.com/audio/2022/12/13/audio_a7e11a169f.mp3',
  'https://cdn.pixabay.com/audio/2024/05/28/audio_5bbbca17bf.mp3'
];
var musicFile = tempDir + '/music.mp3';
await download(MUSIC_TRACKS[Math.floor(Math.random() * MUSIC_TRACKS.length)], musicFile);

var sceneFiles = [];
for (var i = 0; i < scenes.length; i++) {
  var sceneFile = tempDir + '/scene_' + String(i + 1).padStart(2, '0') + '.mp4';
  await download(scenes[i].url, sceneFile);
  sceneFiles.push(sceneFile);
}

// Medir duracao real de cada cena
var scenesDuration = 0;
for (var si = 0; si < sceneFiles.length; si++) {
  var sd = parseFloat(childProcess.execSync(
    'ffprobe -v quiet -show_entries format=duration -of csv=p=0 "' + sceneFiles[si] + '"'
  ).toString().trim()) || 6;
  scenesDuration += sd;
}

// CTA duration: garante que video >= audio (nada cortado)
var MIN_CTA     = 4;
var ctaDuration = Math.max(Math.ceil(audioDuration - scenesDuration), MIN_CTA);

// FIX 2: ultima cena (mais gloriosa) como fundo do CTA
var ctaSource = sceneFiles[sceneFiles.length - 1];
var ctaRaw    = tempDir + '/cta_raw.mp4';
childProcess.execSync(
  'ffmpeg -y -stream_loop -1 -i "' + ctaSource + '" -t ' + ctaDuration +
  ' -c:v libx264 -preset ultrafast -an "' + ctaRaw + '"',
  { timeout: 60000 }
);

// Concat cenas + CTA
var allFiles   = sceneFiles.concat([ctaRaw]);
var concatList = tempDir + '/concat_full.txt';
fs2.writeFileSync(concatList, allFiles.map(function(f) { return "file '" + f + "'"; }).join('\n'));
var fullConcat = tempDir + '/full_concat.mp4';
childProcess.execSync(
  'ffmpeg -y -f concat -safe 0 -i "' + concatList + '"' +
  ' -c:v libx264 -preset veryfast -crf 23' +
  ' -vf scale=1080:1920:flags=lanczos' +
  ' -an "' + fullConcat + '"',
  { timeout: 300000 }
);

// Drawtext helpers
function escapeDrawtext(str) {
  return (str || '')
    .replace(/\\/g,  '')
    .replace(/'/g,   '\u2019')
    .replace(/:/g,   ' -')
    .replace(/[\[\]%"]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function splitIntoGroups(text) {
  if (!text) return [];
  var parts = text.trim().split(/([.!?]+)/);
  var sentences = [];
  for (var i = 0; i < parts.length; i += 2) {
    var body  = (parts[i]     || '').trim();
    var punct = (parts[i + 1] || '').trim();
    var s = (body + punct).trim();
    if (s) sentences.push(s);
  }
  if (!sentences.length) sentences = [text.trim()];
  var groups = [];
  sentences.forEach(function(sentence) {
    sentence = sentence.trim();
    if (!sentence) return;
    var words = sentence.split(/\s+/);
    if (words.length <= 5) { groups.push(sentence); }
    else {
      for (var gi = 0; gi < words.length; gi += 5) {
        var chunk = words.slice(gi, gi + 5).join(' ');
        if (chunk) groups.push(chunk);
      }
    }
  });
  return groups.length ? groups : [text.trim()];
}

// FIX 1: stopAt = videoDuration → legendas aparecem durante todo o audio
// (inclusive durante o CTA). CTA texto fica em y=h*72/100, legendas em y=h-200
// — posicoes distintas, sem sobreposicao visual.
function buildSubtitleFilters(text, fontP, narDur, stopAt) {
  if (!text) return [];
  var groups   = splitIntoGroups(text);
  var perGroup = narDur / groups.length;
  var filters  = [];
  groups.forEach(function(group, idx) {
    var start      = idx * perGroup;
    var end        = (idx + 1) * perGroup;
    var displayEnd = Math.min(end, stopAt);
    if (start >= stopAt) return;
    filters.push(
      'drawtext=fontfile=' + fontP +
      ':text=\'' + escapeDrawtext(group) + '\'' +
      ':fontsize=56:fontcolor=white' +
      ':bordercolor=black@1.0:borderw=5' +
      ':x=(w-text_w)/2:y=h-200' +
      ':enable=\'between(t,' + start.toFixed(2) + ',' + displayEnd.toFixed(2) + ')\''
    );
  });
  return filters;
}

// CTA: max 6 palavras/linha, fontsize 52
function buildCtaFilters(text, fontP, startTime) {
  var cleaned = (text || '').trim();
  if (!cleaned) return [];
  var words = cleaned.split(/\s+/);
  var lines  = [];
  for (var li = 0; li < words.length; li += 6) {
    var line = escapeDrawtext(words.slice(li, li + 6).join(' '));
    if (line) lines.push(line);
  }
  var en    = 'gte(t,' + startTime.toFixed(2) + ')';
  var lineH = 80;
  var out   = [];
  lines.forEach(function(line, idx) {
    var yExpr = idx === 0 ? '(h*72)/100' : '(h*72)/100+' + (idx * lineH);
    out.push(
      'drawtext=fontfile=' + fontP +
      ':text=\'' + line + '\'' +
      ':fontsize=52:fontcolor=white' +
      ':bordercolor=black@1.0:borderw=5' +
      ':box=1:boxcolor=black@0.65:boxborderw=14' +
      ':x=(w-text_w)/2:y=' + yExpr +
      ':enable=\'' + en + '\''
    );
  });
  return out;
}

// FIX 1: stopAt = videoDuration (cobre todo o video) em vez de scenesDuration
var videoDuration = scenesDuration + ctaDuration;
var allVfFilters = buildSubtitleFilters(narracao, fontPath, audioDuration, videoDuration)
  .concat(buildCtaFilters(ctaText, fontPath, scenesDuration));
var vfChain = allVfFilters.length > 0 ? allVfFilters.join(',') : 'null';

var filterComplex =
  '[0:v]' + vfChain + '[v];' +
  '[1:a]volume=1.0[narr];' +
  '[2:a]volume=0.20[mus];' +
  '[narr][mus]amix=inputs=2:duration=first[aout]';

var finalVideo = tempDir + '/final.mp4';
childProcess.execSync(
  'ffmpeg -y' +
  ' -i "' + fullConcat + '"' +
  ' -i "' + audioFile + '"' +
  ' -stream_loop -1 -i "' + musicFile + '"' +
  ' -filter_complex "' + filterComplex + '"' +
  ' -map "[v]" -map "[aout]"' +
  ' -c:v libx264 -preset veryfast -crf 25' +
  ' -c:a aac -b:a 128k -shortest' +
  ' "' + finalVideo + '"',
  { timeout: 300000 }
);

var fileBuffer = fs2.readFileSync(finalVideo);

return [{
  json: {
    videoId:    videoId,
    localPath:  finalVideo,
    titulo:     titulo,
    descricao:  descricao,
    hashtags:   hashtags,
    narracao:   narracao,
    topic:      topic,
    sceneCount: scenes.length,
    fileName:   videoId + '.mp4'
  },
  binary: {
    data: {
      data:          fileBuffer.toString('base64'),
      mimeType:      'video/mp4',
      fileName:      videoId + '.mp4',
      fileExtension: 'mp4'
    }
  }
}];
"""

print("Patching FFmpeg: Assemble Video (v6)...")
wf_main = get("zloYjCYLVf6BWhF9")
patched = False
for node in wf_main["nodes"]:
    if node["name"] == "FFmpeg: Assemble Video":
        node["parameters"]["jsCode"] = NEW_FFMPEG_CODE
        patched = True
        print("  Patched")

if not patched:
    print("ERROR: node 'FFmpeg: Assemble Video' not found!")
    sys.exit(1)

st = put("zloYjCYLVf6BWhF9", wf_main)
print("  PUT:", st)

if st == 200:
    print()
    print("=== DONE v6 ===")
    print("FIX 1: Legendas - stopAt = videoDuration -> nenhuma legenda cortada durante o CTA")
    print("FIX 2: CTA fundo - ultima cena Ken Burns (mais gloriosa) em vez de indice 2")

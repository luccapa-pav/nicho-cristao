"""
Fix 5 bugs in Main + SUB Content workflows:
1. FFmpeg: Remove buildGanchoFilters (gancho is narrated, not shown)
2. Parse Script: Prepend gancho_inicial to narracao so ElevenLabs narrates it
3. FFmpeg: CTA max 6 words/line, fontsize 52 (no more overflow)
4. FFmpeg: Subtitles stop at scenesDuration (not narDur)
5. FFmpeg: Remove atempo speedup (ElevenLabs already at 1.2x)
"""
import json, urllib.request, urllib.error, sys
sys.stdout.reconfigure(encoding='utf-8')

N8N = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzM2QzZDk5YS00NjMyLTQyMmItOTZkZi03ZTc5M2Y5YzMwZjUiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiY2RlNzMzM2MtMTJlMS00ZmJjLWE0OTItZDJhYjVkM2U5ZGE1IiwiaWF0IjoxNzczMTkwOTA0fQ.DI0te7DG89FQOywg1jdXRGbsV8udA-NuaEK88nvIYBs"

def get(wf_id):
    req = urllib.request.Request("https://n8n-n8n.yjlhot.easypanel.host/api/v1/workflows/" + wf_id)
    req.add_header("X-N8N-API-KEY", N8N)
    req.add_header("Accept", "application/json")
    with urllib.request.urlopen(req, timeout=15) as r:
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
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status
    except urllib.error.HTTPError as e:
        print("ERRO:", e.code, e.read().decode()[:300])
        return e.code


# ── FIX 2: Parse Script — prefixar gancho na narração ─────────────────────
PARSE_SCRIPT_CODE = r"""var response = $input.first();
var prevData = $('Prepare Prompt').first().json;

var candidates = response.json.candidates;
var text = (candidates && candidates[0] && candidates[0].content
  && candidates[0].content.parts && candidates[0].content.parts[0])
  ? candidates[0].content.parts[0].text : "";

if (!text) throw new Error("Gemini returned no content: " + JSON.stringify(response.json).substring(0,200));

var clean = text.replace(/```json/g, "").replace(/```/g, "").trim();

var script;
try { script = JSON.parse(clean); }
catch(e) {
  var match = clean.match(/{[\s\S]*}/);
  if (match) { script = JSON.parse(match[0]); }
  else throw new Error("Invalid JSON: " + clean.substring(0,200));
}

if (!script.cenas || !Array.isArray(script.cenas)) throw new Error("Missing cenas array");

var dur = script.cenas.reduce(function(s,c){ return s+(c.duracao_segundos||6); }, 0);

var topic = prevData.topic || prevData;

// FIX 2: gancho_inicial agora é narrado — prefixar na narração enviada ao ElevenLabs
var gancho = (topic && topic.gancho_inicial) ? topic.gancho_inicial.trim() : '';
var narracao = (gancho ? gancho + '. ' : '') + (script.narracao_completa || '');

return [{ json: {
  videoId: prevData.videoId,
  topicIndex: prevData.topicIndex,
  topic: prevData.topic,
  script: script,
  titulo: script.titulo,
  descricao: script.descricao,
  hashtags: script.hashtags,
  narracao: narracao,
  cenas: script.cenas,
  duracao_total_segundos: dur,
  GOOGLE_AI_API_KEY: prevData.GOOGLE_AI_API_KEY || topic.GOOGLE_AI_API_KEY || "",
  ELEVENLABS_API_KEY: prevData.ELEVENLABS_API_KEY || topic.ELEVENLABS_API_KEY || "",
  ctaText: (script.cta && script.cta.texto_completo) || "",
  status: "script_ready"
} }];
"""


# ── FIX 1+3+4+5: FFmpeg completo ─────────────────────────────────────────
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

var audioDurRaw = childProcess.execSync(
  'ffprobe -v quiet -show_entries format=duration -of csv=p=0 "' + audioFile + '"'
).toString().trim();
var audioDuration = parseFloat(audioDurRaw) || 30;

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

// Medir duração real das cenas
var scenesDuration = 0;
for (var si = 0; si < sceneFiles.length; si++) {
  var sd = parseFloat(childProcess.execSync(
    'ffprobe -v quiet -show_entries format=duration -of csv=p=0 "' + sceneFiles[si] + '"'
  ).toString().trim()) || 6;
  scenesDuration += sd;
}

// ── Garantir 30s total ────────────────────────────────────────────────────
// FIX 5: NÃO usar atempo — ElevenLabs já está a 1.2x
// CTA clip usa -stream_loop -1 para nunca ser cortado
var TARGET_TOTAL = 30;
var MIN_CTA      = 4;
var ctaDuration  = Math.max(TARGET_TOTAL - audioDuration, MIN_CTA);

// ── Step 1: CTA clip com stream_loop (nunca cortado) ─────────────────────
var ctaSource = sceneFiles[Math.min(2, sceneFiles.length - 1)];
var ctaRaw    = tempDir + '/cta_raw.mp4';
childProcess.execSync(
  'ffmpeg -y -stream_loop -1 -i "' + ctaSource + '" -t ' + ctaDuration +
  ' -c:v libx264 -preset ultrafast -an "' + ctaRaw + '"',
  { timeout: 60000 }
);

// ── Step 2: Concat cenas + CTA ───────────────────────────────────────────
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

// ── Drawtext helpers ──────────────────────────────────────────────────────
function escapeDrawtext(str) {
  return (str || '')
    .replace(/\\/g,  '')
    .replace(/'/g,   '\u2019')
    .replace(/:/g,   ' -')
    .replace(/[\[\]%]/g, '')
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

// FIX 4: legendas distribuídas em scenesDuration → param quando CTA começa
function buildSubtitleFilters(text, fontP, dur) {
  if (!text) return [];
  var groups   = splitIntoGroups(text);
  var perGroup = dur / groups.length;
  var filters  = [];
  groups.forEach(function(group, idx) {
    var start = idx * perGroup;
    var end   = Math.min((idx + 1) * perGroup, dur);
    if (start >= dur) return; // não exibir após scenesDuration
    filters.push(
      'drawtext=fontfile=' + fontP +
      ':text=\'' + escapeDrawtext(group) + '\'' +
      ':fontsize=56:fontcolor=white' +
      ':bordercolor=black@1.0:borderw=5' +
      ':x=(w-text_w)/2:y=h-200' +
      ':enable=\'between(t,' + start.toFixed(2) + ',' + end.toFixed(2) + ')\''
    );
  });
  return filters;
}

// FIX 3: CTA máx 6 palavras/linha, fontsize 52 → não transborda o frame
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

// ── Step 3: Montagem final ───────────────────────────────────────────────
// FIX 1: sem buildGanchoFilters (gancho é só narrado)
// FIX 4: legendas param em scenesDuration
var allVfFilters = buildSubtitleFilters(narracao, fontPath, scenesDuration)
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

# ── Apply fixes ────────────────────────────────────────────────────────────
print("Applying Fix 2: Parse Script (gancho prepended to narracao)...")
wf_sub = get("9tlW8BErnLH1ujOS")
for node in wf_sub["nodes"]:
    if node["name"] == "Parse Script":
        node["parameters"]["jsCode"] = PARSE_SCRIPT_CODE
        print("  Patched: Parse Script")
st = put("9tlW8BErnLH1ujOS", wf_sub)
print("  SUB Content PUT:", st)

print()
print("Applying Fixes 1+3+4+5: FFmpeg: Assemble Video...")
wf_main = get("zloYjCYLVf6BWhF9")
for node in wf_main["nodes"]:
    if node["name"] == "FFmpeg: Assemble Video":
        node["parameters"]["jsCode"] = NEW_FFMPEG_CODE
        print("  Patched: FFmpeg: Assemble Video")
st = put("zloYjCYLVf6BWhF9", wf_main)
print("  Main PUT:", st)

print()
print("=== DONE ===")
print("Fix 1: Overlay do gancho removido do FFmpeg")
print("Fix 2: gancho_inicial prefixado na narracao (ElevenLabs narra o gancho)")
print("Fix 3: CTA max 6 palavras/linha + fontsize 52 (sem overflow)")
print("Fix 4: Legendas param em scenesDuration (nao aparecem durante CTA)")
print("Fix 5: atempo removido (ElevenLabs ja esta a 1.2x)")

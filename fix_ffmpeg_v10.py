"""
Fix v10 — Fixes M, N, O, Q, R:
M: Karaoke 2 camadas (branco contexto y=h-150 + amarelo palavra y=h-230)
N: Fade-in do preto 0.5s (primeiro filtro da cadeia)
O: Watermark pulsante fontsize=28+2*sin(t*3)
Q: Timing de palavra proporcional ao comprimento (integrado no M)
R: Fade-out para preto 0.5s (fora do vfChain, no filterComplex)
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

// ── CONFIGURACAO DE BRANDING ─────────────────────────────────────────────────
var LOGO_URL       = '';
var CHANNEL_HANDLE = '@NichoCristao';
// ────────────────────────────────────────────────────────────────────────────

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
        file.destroy();
        try { fs2.unlinkSync(destPath); } catch(e) {}
        return download(res.headers.location, destPath).then(resolve).catch(reject);
      }
      res.pipe(file);
      file.on('finish', function() { file.destroy(); resolve(); });
      file.on('error', reject);
      res.on('error', reject);
    }).on('error', function(err) {
      try { fs2.unlinkSync(destPath); } catch(e) {}
      reject(err);
    });
  });
}

async function downloadWithRetry(url, destPath) {
  var maxRetries = 3;
  var lastError;
  for (var i = 0; i < maxRetries; i++) {
    try { await download(url, destPath); return; } catch (err) {
      lastError = err;
      if (i < maxRetries - 1) await new Promise(function(r) { setTimeout(r, Math.pow(2, i) * 1000); });
    }
  }
  throw new Error('Download failed after ' + maxRetries + ' attempts: ' + url + ' — ' + lastError.message);
}

function probeDuration(filePath) {
  var raw = childProcess.execSync(
    'ffprobe -v quiet -print_format json -show_format "' + filePath + '"'
  ).toString();
  var dur = parseFloat((JSON.parse(raw).format || {}).duration || 0);
  if (isNaN(dur) || dur <= 0) throw new Error('Invalid duration for ' + filePath + ': ' + dur);
  return dur;
}

var fontPath = '/home/node/.n8n/temp/Roboto-Bold.ttf';
if (!fs2.existsSync(fontPath)) {
  await downloadWithRetry('https://github.com/google/fonts/raw/main/apache/roboto/static/Roboto-Bold.ttf', fontPath);
}

var audioFile = tempDir + '/narration.mp3';
await downloadWithRetry(audioUrl, audioFile);
var audioDuration = probeDuration(audioFile);

var MUSIC_TRACKS = [
  'https://cdn.pixabay.com/audio/2022/12/13/audio_a7e11a169f.mp3',
  'https://cdn.pixabay.com/audio/2024/05/28/audio_5bbbca17bf.mp3'
];
var musicFile = tempDir + '/music.mp3';
await downloadWithRetry(MUSIC_TRACKS[Math.floor(Math.random() * MUSIC_TRACKS.length)], musicFile);

var sceneFiles = [];
for (var i = 0; i < scenes.length; i++) {
  var sceneFile = tempDir + '/scene_' + String(i + 1).padStart(2, '0') + '.mp4';
  await downloadWithRetry(scenes[i].url, sceneFile);
  sceneFiles.push(sceneFile);
}

// ── FIX J: XFADE ENTRE CENAS (preservado de v9) ──────────────────────────────
var FADE_DUR = 0.4;
var N = sceneFiles.length;

var scaledSceneFiles = [];
for (var sci = 0; sci < N; sci++) {
  var scaledScene = tempDir + '/scene_scaled_' + String(sci + 1).padStart(2, '0') + '.mp4';
  childProcess.execSync(
    'ffmpeg -y -i "' + sceneFiles[sci] + '"' +
    ' -vf "scale=1080:1920:flags=lanczos,setsar=1,fps=30"' +
    ' -c:v libx264 -preset veryfast -crf 23 -an "' + scaledScene + '"',
    { timeout: 120000 }
  );
  scaledSceneFiles.push(scaledScene);
}

var scaledDurations = [];
for (var sdi = 0; sdi < N; sdi++) {
  scaledDurations.push(probeDuration(scaledSceneFiles[sdi]));
}

var rawScenesDuration = 0;
for (var ri = 0; ri < scaledDurations.length; ri++) rawScenesDuration += scaledDurations[ri];
var scenesDuration = rawScenesDuration - (N - 1) * FADE_DUR;

var MIN_CTA     = 4;
var ctaDuration = Math.max(Math.ceil(audioDuration - scenesDuration), MIN_CTA);
var ctaRaw      = tempDir + '/cta_raw.mp4';
childProcess.execSync(
  'ffmpeg -y -stream_loop -1 -i "' + scaledSceneFiles[N - 1] + '" -t ' + ctaDuration +
  ' -c:v libx264 -preset veryfast -crf 23 -an "' + ctaRaw + '"',
  { timeout: 60000 }
);

var xfadedScenes;
if (N === 1) {
  xfadedScenes = scaledSceneFiles[0];
} else {
  var xfInputs  = scaledSceneFiles.map(function(f) { return '-i "' + f + '"'; }).join(' ');
  var xfFilters = [];
  var cumDur    = 0;
  var prevLabel = '0:v';
  for (var xi = 0; xi < N - 1; xi++) {
    cumDur += scaledDurations[xi];
    var xfOffset = Math.max(cumDur - (xi + 1) * FADE_DUR, 0).toFixed(3);
    var outLabel = xi === N - 2 ? 'xout' : 'x' + (xi + 1);
    xfFilters.push('[' + prevLabel + '][' + (xi + 1) + ':v]xfade=transition=fade:duration=' + FADE_DUR + ':offset=' + xfOffset + '[' + outLabel + ']');
    prevLabel = outLabel;
  }
  var xfadeVideo = tempDir + '/xfaded_scenes.mp4';
  childProcess.execSync(
    'ffmpeg -y ' + xfInputs +
    ' -filter_complex "' + xfFilters.join(';') + '"' +
    ' -map "[xout]" -c:v libx264 -preset veryfast -crf 23 -an "' + xfadeVideo + '"',
    { timeout: 300000 }
  );
  xfadedScenes = xfadeVideo;
}

var concatList = tempDir + '/concat_full.txt';
fs2.writeFileSync(concatList, [xfadedScenes, ctaRaw].map(function(f) { return "file '" + f + "'"; }).join('\n'));
var fullConcat = tempDir + '/full_concat.mp4';
childProcess.execSync(
  'ffmpeg -y -f concat -safe 0 -i "' + concatList + '" -c:v copy -an "' + fullConcat + '"',
  { timeout: 120000 }
);
// ─────────────────────────────────────────────────────────────────────────────

function escapeDrawtext(str) {
  return (str || '')
    .replace(/\\/g,  '')
    .replace(/'/g,   '\u2019')
    .replace(/:/g,   ' -')
    .replace(/[\[\]%"]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// ── FIX M+Q: KARAOKE 2 CAMADAS COM TIMING PROPORCIONAL ───────────────────────
// Layer 1: grupo de 5 palavras em branco (contexto), y=h-150, fontsize=46
// Layer 2: palavra atual em amarelo, y=h-230, fontsize=72
// Fix Q: cada palavra dura narDur * word.length / totalChars (proporcional)
function buildSubtitleFilters(text, fontP, narDur, stopAt) {
  if (!text) return [];
  var words = text.trim().split(/\s+/).filter(function(w) { return w.length > 0; });
  if (!words.length) return [];

  // Fix Q: calcular totalChars com floor minimo de 1 por palavra (evita ZeroDivision)
  var totalChars = words.reduce(function(sum, w) { return sum + Math.max(w.length, 1); }, 0);

  // Cumular start/end de cada palavra
  var wordStarts = [];
  var wordEnds   = [];
  var cursor = 0;
  for (var wi = 0; wi < words.length; wi++) {
    wordStarts.push(cursor);
    cursor += narDur * Math.max(words[wi].length, 1) / totalChars;
    wordEnds.push(Math.min(cursor, narDur));
  }

  var filters  = [];
  var GRP_SIZE = 5;

  for (var gi = 0; gi < words.length; gi += GRP_SIZE) {
    var gEnd        = Math.min(gi + GRP_SIZE, words.length);
    var groupWords  = words.slice(gi, gEnd);
    var groupText   = escapeDrawtext(groupWords.join(' '));
    var groupStart  = wordStarts[gi];
    var groupEnd    = wordEnds[gEnd - 1];
    var gDisplayEnd = Math.min(groupEnd, stopAt);

    // Pular grupo vazio ou que começa apos o fim do video
    if (!groupText || groupStart >= stopAt) continue;

    // Layer 1: grupo completo em branco semi-transparente (contexto)
    filters.push(
      'drawtext=fontfile=' + fontP +
      ':text=\'' + groupText + '\'' +
      ':fontsize=46:fontcolor=white@0.55' +
      ':bordercolor=black@0.9:borderw=4' +
      ':x=(w-text_w)/2:y=h-150' +
      ':enable=\'between(t,' + groupStart.toFixed(3) + ',' + gDisplayEnd.toFixed(3) + ')\''
    );

    // Layer 2: cada palavra individualmente em amarelo (destaque)
    for (var i = gi; i < gEnd; i++) {
      var wordText    = escapeDrawtext(words[i]);
      var wStart      = wordStarts[i];
      var wEnd        = wordEnds[i];
      var wDisplayEnd = Math.min(wEnd, stopAt);

      if (!wordText || wStart >= stopAt) continue;

      filters.push(
        'drawtext=fontfile=' + fontP +
        ':text=\'' + wordText + '\'' +
        ':fontsize=72:fontcolor=yellow' +
        ':bordercolor=black@1.0:borderw=5' +
        ':x=(w-text_w)/2:y=h-230' +
        ':enable=\'between(t,' + wStart.toFixed(3) + ',' + wDisplayEnd.toFixed(3) + ')\''
      );
    }
  }
  return filters;
}
// ─────────────────────────────────────────────────────────────────────────────

// Fix K: CTA slide-in (preservado de v9)
function buildCtaFilters(text, fontP, startTime) {
  var cleaned = (text || '').trim();
  if (!cleaned) return [];
  var words = cleaned.split(/\s+/);
  var lines  = [];
  for (var li = 0; li < words.length; li += 6) {
    var line = escapeDrawtext(words.slice(li, li + 6).join(' '));
    if (line) lines.push(line);
  }
  var SLIDE  = 0.5;
  var T      = startTime.toFixed(3);
  var lineH  = 80;
  var out    = [];
  lines.forEach(function(line, idx) {
    var finalY     = idx === 0 ? '(h*72/100)' : '(h*72/100+' + (idx * lineH) + ')';
    var slideRatio = 'if(gte(t-' + T + ',' + SLIDE + '),0,1-(t-' + T + ')/' + SLIDE + ')';
    var yExpr      = finalY + '+100*' + slideRatio;
    out.push(
      'drawtext=fontfile=' + fontP +
      ':text=\'' + line + '\'' +
      ':fontsize=52:fontcolor=white' +
      ':bordercolor=black@1.0:borderw=5' +
      ':box=1:boxcolor=black@0.65:boxborderw=14' +
      ':x=(w-text_w)/2:y=' + yExpr +
      ':enable=\'gte(t,' + T + ')\''
    );
  });
  return out;
}

// Fix R: calcular fadeOutFilter ANTES de montar o filterComplex
var videoDuration  = scenesDuration + ctaDuration;
var fadeOutSt      = Math.max(videoDuration - 0.5, 0);
var fadeOutFilter  = fadeOutSt > 0 ? 'fade=t=out:st=' + fadeOutSt.toFixed(3) + ':d=0.5' : null;

var allVfFilters = buildSubtitleFilters(narracao, fontPath, audioDuration, videoDuration)
  .concat(buildCtaFilters(ctaText, fontPath, scenesDuration));

// Branding
var logoPath = '/home/node/.n8n/temp/logo.png';
var hasLogo  = false;
if (LOGO_URL) {
  try {
    if (!fs2.existsSync(logoPath)) await downloadWithRetry(LOGO_URL, logoPath);
    hasLogo = true;
  } catch(e) { hasLogo = false; }
}
if (!hasLogo) {
  // Fix O: watermark pulsante — fontsize oscila entre 26 e 30px a ~0.5Hz
  allVfFilters.push(
    'drawtext=fontfile=' + fontPath +
    ':text=\'' + CHANNEL_HANDLE + '\'' +
    ':fontsize=28+2*sin(t*3):fontcolor=white@0.65' +
    ':bordercolor=black@0.50:borderw=2' +
    ':x=w-text_w-20:y=20'
  );
}

// Fix N: fade-in do preto PRIMEIRO (unshift garante posicao 0 na cadeia)
allVfFilters.unshift('fade=t=in:st=0:d=0.5');

var vfChain        = allVfFilters.length > 0 ? allVfFilters.join(',') : 'null';
var musicFadeStart = Math.max(audioDuration - 2, 0).toFixed(2);

// Fix R: fadeOutFilter aplicado FORA do vfChain (depois do overlay se houver logo)
var filterComplex, ffmpegLogoInput;
if (hasLogo) {
  ffmpegLogoInput = ' -i "' + logoPath + '"';
  var overlayEnd  = 'overlay=W-w-20:20' + (fadeOutFilter ? ',' + fadeOutFilter : '');
  filterComplex =
    '[0:v]' + vfChain + '[vtext];' +
    '[3:v]scale=120:-1[logo];' +
    '[vtext][logo]' + overlayEnd + '[v];' +
    '[1:a]volume=1.0[narr];' +
    '[2:a]volume=0.20,afade=t=out:st=' + musicFadeStart + ':d=2[mus];' +
    '[narr][mus]amix=inputs=2:duration=first[aout]';
} else {
  ffmpegLogoInput  = '';
  var vFinal       = fadeOutFilter ? vfChain + ',' + fadeOutFilter : vfChain;
  filterComplex =
    '[0:v]' + vFinal + '[v];' +
    '[1:a]volume=1.0[narr];' +
    '[2:a]volume=0.20,afade=t=out:st=' + musicFadeStart + ':d=2[mus];' +
    '[narr][mus]amix=inputs=2:duration=first[aout]';
}

var finalVideo = tempDir + '/final.mp4';
childProcess.execSync(
  'ffmpeg -y' +
  ' -i "' + fullConcat + '"' +
  ' -i "' + audioFile + '"' +
  ' -stream_loop -1 -i "' + musicFile + '"' +
  ffmpegLogoInput +
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

print("Patching FFmpeg: Assemble Video (v10 — M/N/O/Q/R)...")
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
    print("=== DONE v10 ===")
    print("FIX M: Karaoke 2 camadas — branco contexto (y=h-150) + amarelo palavra (y=h-230)")
    print("FIX N: Fade-in do preto 0.5s (primeiro filtro da cadeia)")
    print("FIX O: Watermark pulsante fontsize=28+2*sin(t*3) (~0.5Hz, ±2px)")
    print("FIX Q: Timing proporcional ao comprimento da palavra (chars/totalChars)")
    print("FIX R: Fade-out para preto 0.5s (fora do vfChain, no filterComplex)")

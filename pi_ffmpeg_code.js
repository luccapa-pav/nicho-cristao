var childProcess = require('child_process');
function execAsync(cmd, opts) {
  return new Promise(function(resolve, reject) {
    childProcess.exec(cmd, opts || {}, function(err, stdout, stderr) {
      if (err) { reject(new Error((stderr || '') + ' ' + err.message)); return; }
      resolve(stdout);
    });
  });
}
var fs2 = require('fs');
var https2 = require('https');
var http2 = require('http');

var data = $input.first().json;
var videoId    = data.videoId;
var hookUrl    = data.hookVideoUrl;
var images     = (data.images || []).sort(function(a,b){ return (a.numero||0)-(b.numero||0); });
var ctaText    = data.ctaText   || '';
var titulo     = data.titulo    || '';
var fraseHook  = data.frase_hook  || '';
var fraseJesus = data.frase_jesus || '';
var watermark  = data.watermark   || '';

if (!hookUrl)       throw new Error('No hookVideoUrl');
if (!images.length) throw new Error('No images');

var MUSIC_TRACKS = [
  'https://cdn.pixabay.com/audio/2024/02/27/audio_6d33c54bfa.mp3',
  'https://cdn.pixabay.com/audio/2022/10/30/audio_0b4c6ed258.mp3',
  'https://cdn.pixabay.com/audio/2023/06/08/audio_6d8e54f896.mp3'
];
var musicUrl = MUSIC_TRACKS[Math.floor(Math.random() * MUSIC_TRACKS.length)];
var SFX_URL = 'https://cdn.pixabay.com/audio/2022/03/24/audio_51d815d29b.mp3';

var tempDir = '/home/node/.n8n/temp/' + videoId;
fs2.mkdirSync(tempDir, { recursive: true });

function download(fileUrl, destPath, _redirects) {
  _redirects = _redirects || 0;
  if (_redirects > 6) return Promise.reject(new Error('Too many redirects: ' + fileUrl));
  return new Promise(function(resolve, reject) {
    var mod = fileUrl.startsWith('https:') ? https2 : http2;
    var opts = {
      rejectUnauthorized: false,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; n8n-ffmpeg/1.0)',
        'Accept': '*/*'
      }
    };
    var file = fs2.createWriteStream(destPath);
    mod.get(fileUrl, opts, function(res) {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        file.close();
        try { fs2.unlinkSync(destPath); } catch(e) {}
        return download(res.headers.location, destPath, _redirects + 1).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        file.close();
        try { fs2.unlinkSync(destPath); } catch(e) {}
        return reject(new Error('HTTP ' + res.statusCode + ' for ' + fileUrl));
      }
      res.pipe(file);
      file.on('finish', function() { file.close(resolve); });
      res.on('error', reject);
    }).on('error', function(err) { try { fs2.unlink(destPath, function(){}); } catch(e) {} reject(err); });
  });
}

// ── Fonts ─────────────────────────────────────────────────────────────────
var fontPath   = '/home/node/.n8n/temp/Roboto-Bold.ttf';
var cinzelPath = '/home/node/.n8n/temp/Cinzel-Bold.ttf';
if (!fs2.existsSync(fontPath)) {
  await download('https://github.com/google/fonts/raw/main/apache/roboto/static/Roboto-Bold.ttf', fontPath);
}
if (!fs2.existsSync(cinzelPath)) {
  await download('https://github.com/google/fonts/raw/main/ofl/cinzel/static/Cinzel-Bold.ttf', cinzelPath);
}

// ── Download assets ───────────────────────────────────────────────────────
var hookRaw   = tempDir + '/hook_raw.mp4';
var musicFile = tempDir + '/music.mp3';
var sfxFile   = tempDir + '/sfx.mp3';
await download(hookUrl, hookRaw);

// isValidAudio: checks magic bytes for OGG (OggS), MP3 (ID3 / 0xFF 0xEx)
function isValidAudio(p) {
  try {
    var b = fs2.readFileSync(p);
    if (b.length < 8) return false;
    // OGG
    if (b[0]===0x4F&&b[1]===0x67&&b[2]===0x67&&b[3]===0x53) return true;
    // ID3-tagged MP3
    if (b[0]===0x49&&b[1]===0x44&&b[2]===0x33) return true;
    // Raw MP3 frame sync
    if (b[0]===0xFF&&(b[1]&0xE0)===0xE0) return true;
    return false;
  } catch(e) { return false; }
}

var musicOk = false;
try {
  if (fs2.existsSync(musicFile)) fs2.unlinkSync(musicFile);
  await download(musicUrl, musicFile);
  if (isValidAudio(musicFile)) { musicOk = true; }
  else console.log('Music invalid audio format, skipping');
} catch(e) { console.log('Music skip:', e.message); }

var sfxOk = false;
try {
  if (fs2.existsSync(sfxFile)) fs2.unlinkSync(sfxFile);
  await download(SFX_URL, sfxFile);
  if (isValidAudio(sfxFile)) { sfxOk = true; }
  else console.log('SFX invalid audio format, skipping');
} catch(e) { console.log('SFX skip:', e.message); }

var imgFiles = [];
for (var i = 0; i < images.length; i++) {
  var imgFile = tempDir + '/img_' + String(i+1).padStart(2,'0') + '.jpg';
  await download(images[i].url, imgFile);
  imgFiles.push(imgFile);
}

// ── Step 0: Hook — zoom in + color grade escuro/dessaturado ───────────────
var hookFile = tempDir + '/hook.mp4';
await execAsync(
  'ffmpeg -y -i "' + hookRaw + '"' +
  ' -vf "zoompan=z=\'1+0.25*(time/4)\':x=\'iw/2-(iw/zoom/2)\':y=\'ih/2-(ih/zoom/2)\':d=1:fps=25:s=1080x1920' +
  ',eq=saturation=0.6:brightness=-0.08,format=yuv420p"' +
  ' -c:v libx264 -preset veryfast -crf 23 "' + hookFile + '"',
  { timeout: 90000, maxBuffer: 10*1024*1024 }
);

// ── Step 1: Ken Burns — 3 variantes rotativas + warm grade ───────────────
// 0: zoom-in suave (devocional)
// 1: zoom-out dramático (revelação)
// 2: zoom-in celestial pelo topo (perspectiva divina)
var KB_VARIANTS = [
  { z: 'min(zoom+0.0010,1.3)', x: 'iw/2-(iw/zoom/2)', y: 'ih/2-(ih/zoom/2)' },
  { z: 'if(lte(zoom,1.0),1.5,max(1.0,zoom-0.0025))', x: 'iw/2-(iw/zoom/2)', y: 'ih/2-(ih/zoom/2)' },
  { z: 'min(zoom+0.0012,1.3)', x: 'iw/2-(iw/zoom/2)', y: '0' }
];

var kenBurnsClips = [];
for (var ki = 0; ki < imgFiles.length; ki++) {
  var kbFile = tempDir + '/kb_' + String(ki+1).padStart(2,'0') + '.mp4';
  var kbv = KB_VARIANTS[ki % 3];
  await execAsync(
    'ffmpeg -y -loop 1 -i "' + imgFiles[ki] + '"' +
    ' -vf "scale=1620:2880' +
    ',zoompan=z=\'' + kbv.z + '\':x=\'' + kbv.x + '\':y=\'' + kbv.y + '\':d=75:fps=25:s=1080x1920' +
    ',colorbalance=rs=0.15:gs=0.05:bs=-0.10:rm=0.10:gm=0.03:bm=-0.08' +
    ',format=yuv420p"' +
    ' -t 3 -c:v libx264 -preset veryfast -r 25 "' + kbFile + '"',
    { timeout: 120000, maxBuffer: 10*1024*1024 }
  );
  kenBurnsClips.push(kbFile);
}

// ── Step 2: Crossfade 0.7s ────────────────────────────────────────────────
var FADE = 0.7;
var CLIP_DUR = 3.0;
var editConcat, editDuration;
if (kenBurnsClips.length === 1) {
  editConcat = kenBurnsClips[0];
  editDuration = CLIP_DUR;
} else {
  var kbInputs = kenBurnsClips.map(function(f) { return '-i "' + f + '"'; }).join(' ');
  var filterParts = [];
  var prevLabel = '[0:v]';
  for (var fi = 1; fi < kenBurnsClips.length; fi++) {
    var offset = (fi * CLIP_DUR - fi * FADE).toFixed(2);
    var outLabel = fi === kenBurnsClips.length - 1 ? '[edit]' : '[xf' + fi + ']';
    filterParts.push(prevLabel + '[' + fi + ':v]xfade=transition=fade:duration=' + FADE + ':offset=' + offset + outLabel);
    prevLabel = outLabel;
  }
  editConcat = tempDir + '/edit.mp4';
  editDuration = kenBurnsClips.length * CLIP_DUR - (kenBurnsClips.length - 1) * FADE;
  await execAsync(
    'ffmpeg -y ' + kbInputs +
    ' -filter_complex "' + filterParts.join(';') + '"' +
    ' -map "[edit]" -c:v libx264 -preset veryfast -crf 23 -r 25 "' + editConcat + '"',
    { timeout: 300000, maxBuffer: 10*1024*1024 }
  );
}

// ── Step 3: Concat hook + edit ────────────────────────────────────────────
var concatList = tempDir + '/concat_pi.txt';
fs2.writeFileSync(concatList, "file '" + hookFile + "'\nfile '" + editConcat + "'");
var fullVideo = tempDir + '/full.mp4';
await execAsync(
  'ffmpeg -y -f concat -safe 0 -i "' + concatList + '"' +
  ' -c:v libx264 -preset veryfast -crf 23 -vf scale=1080:1920:flags=lanczos -an "' + fullVideo + '"',
  { timeout: 300000, maxBuffer: 10*1024*1024 }
);

// ── Step 4: Overlays + música + SFX + fade out ────────────────────────────
function escapeDrawtext(str) {
  return (str || '').replace(/\\/g,'').replace(/'/g,'\u2019').replace(/:/g,' -').replace(/[\[\]%]/g,'').replace(/\s{2,}/g,' ').trim();
}
function splitIntoLines(text, maxChars) {
  var t = escapeDrawtext(text || '');
  if (t.length <= maxChars) return [t, ''];
  var words = t.split(' ');
  var line1 = '';
  var line2 = '';
  for (var wi = 0; wi < words.length; wi++) {
    var candidate = line1 ? line1 + ' ' + words[wi] : words[wi];
    if (candidate.length <= maxChars) { line1 = candidate; }
    else { line2 = words.slice(wi).join(' '); break; }
  }
  return [line1, line2];
}

var hookLines  = splitIntoLines(fraseHook,  22);
var jesusLines = splitIntoLines(fraseJesus, 30);

var HOOK_DUR  = 3;
var CTA_DUR   = 4;
var ctaStart  = (HOOK_DUR + editDuration - CTA_DUR).toFixed(2);
var totalDur  = HOOK_DUR + editDuration;
var fadeOutSt = (totalDur - 1.2).toFixed(2);

var vfFilters = [];

// Vinheta nas bordas durante hook (0-3s)
vfFilters.push("drawbox=x=0:y=0:w=iw:h=ih*0.12:color=black@0.5:t=fill:enable='between(t,0,3)'");
vfFilters.push("drawbox=x=0:y=ih*0.88:w=iw:h=ih*0.12:color=black@0.5:t=fill:enable='between(t,0,3)'");
vfFilters.push("drawbox=x=0:y=0:w=iw*0.08:h=ih:color=black@0.3:t=fill:enable='between(t,0,3)'");
vfFilters.push("drawbox=x=iw*0.92:y=0:w=iw*0.08:h=ih:color=black@0.3:t=fill:enable='between(t,0,3)'");

// frase_hook — lower third (0-3s, Roboto, fade)
if (hookLines[0]) vfFilters.push(
  'drawtext=fontfile=' + fontPath +
  ':text=\'' + hookLines[0] + '\'' +
  ':fontsize=68:fontcolor=white:bordercolor=black@0.8:borderw=5' +
  ':x=(w-text_w)/2' +
  ':y=' + (hookLines[1] ? '(h*74)/100' : '(h*78)/100') +
  ':alpha=\'if(lt(t\\,0.5)\\,t/0.5\\,if(gt(t\\,2.5)\\,(3-t)/0.5\\,1))\'' +
  ':enable=\'between(t\\,0\\,3)\''
);
if (hookLines[1]) vfFilters.push(
  'drawtext=fontfile=' + fontPath +
  ':text=\'' + hookLines[1] + '\'' +
  ':fontsize=68:fontcolor=white:bordercolor=black@0.8:borderw=5' +
  ':x=(w-text_w)/2:y=(h*74)/100+80' +
  ':alpha=\'if(lt(t\\,0.5)\\,t/0.5\\,if(gt(t\\,2.5)\\,(3-t)/0.5\\,1))\'' +
  ':enable=\'between(t\\,0\\,3)\''
);

// Flash branco na transicao t=3
vfFilters.push("drawbox=x=0:y=0:w=iw:h=ih:color=white@0.85:t=fill:enable='between(t,3,3.1)'");
vfFilters.push("drawbox=x=0:y=0:w=iw:h=ih:color=white@0.55:t=fill:enable='between(t,3.1,3.2)'");
vfFilters.push("drawbox=x=0:y=0:w=iw:h=ih:color=white@0.25:t=fill:enable='between(t,3.2,3.3)'");

// frase_jesus — topo (3-7s, Cinzel, fade)
if (jesusLines[0]) vfFilters.push(
  'drawtext=fontfile=' + cinzelPath +
  ':text=\'' + jesusLines[0] + '\'' +
  ':fontsize=52:fontcolor=white:bordercolor=black@0.8:borderw=3' +
  ':x=(w-text_w)/2' +
  ':y=' + (jesusLines[1] ? '(h*10)/100' : '(h*11)/100') +
  ':alpha=\'if(lt(t\\,3.5)\\,(t-3)/0.5\\,if(gt(t\\,6.5)\\,(7-t)/0.5\\,1))\'' +
  ':enable=\'between(t\\,3\\,7)\''
);
if (jesusLines[1]) vfFilters.push(
  'drawtext=fontfile=' + cinzelPath +
  ':text=\'' + jesusLines[1] + '\'' +
  ':fontsize=52:fontcolor=white:bordercolor=black@0.8:borderw=3' +
  ':x=(w-text_w)/2:y=(h*10)/100+64' +
  ':alpha=\'if(lt(t\\,3.5)\\,(t-3)/0.5\\,if(gt(t\\,6.5)\\,(7-t)/0.5\\,1))\'' +
  ':enable=\'between(t\\,3\\,7)\''
);

// Watermark — canto inferior direito durante edit (após hook)
if (watermark) vfFilters.push(
  'drawtext=fontfile=' + fontPath +
  ':text=\'' + escapeDrawtext(watermark) + '\'' +
  ':fontsize=28:fontcolor=white@0.45:bordercolor=black@0.3:borderw=2' +
  ':x=(w-text_w)-30:y=(h-text_h)-60' +
  ':enable=\'gte(t\\,3)\''
);

// CTA amarelo — ultimos 4s
var ctaWords = (ctaText || 'Me siga para nao perder sua bencao').trim().split(/\s+/);
var mid = Math.ceil(ctaWords.length / 2);
var cta1 = escapeDrawtext(ctaWords.slice(0, mid).join(' '));
var cta2 = escapeDrawtext(ctaWords.slice(mid).join(' '));
var ctaEn = 'gte(t,' + ctaStart + ')';
if (cta1) vfFilters.push(
  'drawtext=fontfile=' + fontPath + ':text=\'' + cta1 + '\'' +
  ':fontsize=62:fontcolor=#FFD700:bordercolor=black@1.0:borderw=6' +
  ':box=1:boxcolor=black@0.70:boxborderw=18' +
  ':x=(w-text_w)/2:y=(h*15)/100:enable=\'' + ctaEn + '\''
);
if (cta2) vfFilters.push(
  'drawtext=fontfile=' + fontPath + ':text=\'' + cta2 + '\'' +
  ':fontsize=62:fontcolor=#FFD700:bordercolor=black@1.0:borderw=6' +
  ':box=1:boxcolor=black@0.70:boxborderw=18' +
  ':x=(w-text_w)/2:y=(h*15)/100+80:enable=\'' + ctaEn + '\''
);

var vfChain = vfFilters.length ? vfFilters.join(',') : 'null';
var sfxDelay = HOOK_DUR * 1000;
var filterComplex, extraInput;
if (musicOk && sfxOk) {
  filterComplex =
    '[0:v]' + vfChain + '[v];' +
    '[1:a]volume=0.25[music];' +
    '[2:a]adelay=' + sfxDelay + '|' + sfxDelay + ',volume=2.5[sfx];' +
    '[music][sfx]amix=inputs=2:duration=first:dropout_transition=2,' +
    'afade=t=out:st=' + fadeOutSt + ':d=1.0[aout]';
  extraInput = ' -stream_loop -1 -i "' + musicFile + '" -i "' + sfxFile + '"';
} else if (musicOk) {
  filterComplex =
    '[0:v]' + vfChain + '[v];' +
    '[1:a]volume=0.25,afade=t=out:st=' + fadeOutSt + ':d=1.0[aout]';
  extraInput = ' -stream_loop -1 -i "' + musicFile + '"';
} else if (sfxOk) {
  filterComplex =
    '[0:v]' + vfChain + '[v];' +
    '[1:a]adelay=' + sfxDelay + '|' + sfxDelay + ',volume=2.5,afade=t=out:st=' + fadeOutSt + ':d=1.0[aout]';
  extraInput = ' -i "' + sfxFile + '"';
} else {
  filterComplex = '[0:v]' + vfChain + '[v]';
  extraInput = '';
}

var finalVideo = tempDir + '/final_pi.mp4';
var hasAudio = musicOk || sfxOk;
var audioMapFlag = hasAudio ? ' -map "[aout]" -c:a aac -b:a 128k' : ' -an';
await execAsync(
  'ffmpeg -y -i "' + fullVideo + '"' + extraInput +
  ' -filter_complex "' + filterComplex + '"' +
  ' -map "[v]"' + audioMapFlag +
  ' -c:v libx264 -preset veryfast -crf 25' +
  ' -shortest "' + finalVideo + '"',
  { timeout: 300000, maxBuffer: 10*1024*1024 }
);

var fileBuffer = fs2.readFileSync(finalVideo);

return [{
  json: {
    videoId: videoId,
    localPath: finalVideo,
    titulo: titulo,
    descricao: data.descricao || '',
    hashtags:  data.hashtags  || [],
    narracao:  data.narracao  || '',
    fileName:  videoId + '_pi.mp4'
  },
  binary: {
    data: {
      data: fileBuffer.toString('base64'),
      mimeType: 'video/mp4',
      fileName: videoId + '_pi.mp4',
      fileExtension: 'mp4'
    }
  }
}];

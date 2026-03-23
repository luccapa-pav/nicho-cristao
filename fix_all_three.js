const fs = require('fs');

// ═══════════════════════════════════════════════════════════════
// FIX 1: Veo2 sub-workflow — All Scenes Ready → use staticData
// ═══════════════════════════════════════════════════════════════
const veo2 = JSON.parse(fs.readFileSync('./wf_veo2_live.json', 'utf8'));
const allScenesNode = veo2.nodes.find(n => n.name === 'All Scenes Ready');

allScenesNode.parameters.jsCode = [
  "var staticData = $getWorkflowStaticData('global');",
  "var videoId = $input.first().json.videoId;",
  "var scenes = staticData[videoId] || [];",
  "delete staticData[videoId];",
  "if (!scenes.length) throw new Error('No scenes in staticData for ' + videoId);",
  "return [{",
  "  json: {",
  "    videoId: videoId,",
  "    totalScenes: scenes.length,",
  "    scenes: scenes,",
  "    status: 'all_scenes_ready'",
  "  }",
  "}];"
].join('\n');

// keep mode: runOnceForAllItems (needed so it doesn't re-run per item)
allScenesNode.parameters.mode = 'runOnceForAllItems';

const veo2Payload = {
  name: veo2.name,
  nodes: veo2.nodes,
  connections: veo2.connections,
  settings: veo2.settings,
  staticData: veo2.staticData
};
fs.writeFileSync('./wf_veo2_fix3.json', JSON.stringify(veo2Payload));
console.log('Fix 1 saved → wf_veo2_fix3.json');
console.log('  All Scenes Ready uses staticData:', allScenesNode.parameters.jsCode.includes('$getWorkflowStaticData'));

// ═══════════════════════════════════════════════════════════════
// FIX 2 + 3: Main workflow — FFmpeg node with loop + music
// ═══════════════════════════════════════════════════════════════
const main = JSON.parse(fs.readFileSync('./wf_main_ffmpeg.json', 'utf8'));
const ffmpegNode = main.nodes.find(n => n.name === 'FFmpeg: Assemble Video');

const newCode = [
  "var childProcess = require('child_process');",
  "var fs2 = require('fs');",
  "var https2 = require('https');",
  "var http2 = require('http');",
  "",
  "var allItems = $input.all().map(function(i) { return i.json; });",
  "var imageData = allItems.find(function(d) { return d.scenes && d.scenes.length > 0; }) || {};",
  "var audioData = allItems.find(function(d) { return d.audioUrl; }) || {};",
  "var contentData = allItems.find(function(d) { return d.narracao || (d.script && d.script.narracao_completa); })",
  "  || allItems.find(function(d) { return d.titulo; }) || {};",
  "",
  "var videoId = imageData.videoId || audioData.videoId;",
  "var audioUrl = audioData.audioUrl;",
  "if (!audioUrl) throw new Error('No audioUrl for ' + videoId);",
  "",
  "var scenes = (imageData.scenes || [])",
  "  .filter(function(s) { return s.url; })",
  "  .sort(function(a, b) { return (a.numero || 0) - (b.numero || 0); });",
  "if (!scenes.length) throw new Error('No scene URLs for ' + videoId);",
  "",
  "var tempDir = '/home/node/.n8n/temp/' + videoId;",
  "fs2.mkdirSync(tempDir, { recursive: true });",
  "",
  "function download(fileUrl, destPath) {",
  "  return new Promise(function(resolve, reject) {",
  "    var mod = fileUrl.startsWith('https:') ? https2 : http2;",
  "    var file = fs2.createWriteStream(destPath);",
  "    mod.get(fileUrl, { rejectUnauthorized: false }, function(res) {",
  "      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {",
  "        file.close(); fs2.unlinkSync(destPath);",
  "        return download(res.headers.location, destPath).then(resolve).catch(reject);",
  "      }",
  "      res.pipe(file);",
  "      file.on('finish', function() { file.close(resolve); });",
  "      res.on('error', reject);",
  "    }).on('error', function(err) { fs2.unlink(destPath, function(){}); reject(err); });",
  "  });",
  "}",
  "",
  "// Download narration audio",
  "var audioFile = tempDir + '/narration.mp3';",
  "await download(audioUrl, audioFile);",
  "",
  "// Download background music (Pixabay CDN)",
  "var MUSIC_TRACKS = [",
  "  'https://cdn.pixabay.com/audio/2022/12/13/audio_a7e11a169f.mp3',",
  "  'https://cdn.pixabay.com/audio/2024/05/28/audio_5bbbca17bf.mp3'",
  "];",
  "var musicUrl = MUSIC_TRACKS[Math.floor(Math.random() * MUSIC_TRACKS.length)];",
  "var musicFile = tempDir + '/music.mp3';",
  "await download(musicUrl, musicFile);",
  "",
  "// Download scene videos",
  "var sceneFiles = [];",
  "for (var i = 0; i < scenes.length; i++) {",
  "  var sceneFile = tempDir + '/scene_' + String(i + 1).padStart(2, '0') + '.mp4';",
  "  await download(scenes[i].url, sceneFile);",
  "  sceneFiles.push(sceneFile);",
  "}",
  "",
  "// Step 1: concat scenes into a single video",
  "var concatList = tempDir + '/concat.txt';",
  "fs2.writeFileSync(concatList, sceneFiles.map(function(f) { return \"file '\" + f + \"'\"; }).join('\\n'));",
  "var concatVideo = tempDir + '/scenes_concat.mp4';",
  "childProcess.execSync(",
  "  'ffmpeg -y -f concat -safe 0 -i \"' + concatList + '\" -c copy \"' + concatVideo + '\"',",
  "  { timeout: 180000 }",
  ");",
  "",
  "// Step 2: loop video + mix narration (100%) + music (10%), cut at narration end",
  "// -stream_loop -1 loops the concat video infinitely until audio ends (-shortest)",
  "var finalVideo = tempDir + '/final.mp4';",
  "childProcess.execSync(",
  "  'ffmpeg -y' +",
  "  ' -stream_loop -1 -i \"' + concatVideo + '\"' +",
  "  ' -i \"' + audioFile + '\"' +",
  "  ' -stream_loop -1 -i \"' + musicFile + '\"' +",
  "  ' -filter_complex \"[1:a]volume=1.0[narr];[2:a]volume=0.10[mus];[narr][mus]amix=inputs=2:duration=first[aout]\"' +",
  "  ' -map 0:v:0 -map \"[aout]\"' +",
  "  ' -c:v libx264 -preset veryfast -crf 25' +",
  "  ' -c:a aac -b:a 128k' +",
  "  ' -shortest' +",
  "  ' \"' + finalVideo + '\"',",
  "  { timeout: 300000 }",
  ");",
  "",
  "var fileBuffer = fs2.readFileSync(finalVideo);",
  "",
  "return [{",
  "  json: {",
  "    videoId: videoId,",
  "    localPath: finalVideo,",
  "    titulo: contentData.titulo,",
  "    descricao: contentData.descricao,",
  "    hashtags: contentData.hashtags,",
  "    narracao: contentData.narracao,",
  "    topic: contentData.topic,",
  "    sceneCount: scenes.length,",
  "    fileName: videoId + '.mp4'",
  "  },",
  "  binary: {",
  "    data: {",
  "      data: fileBuffer.toString('base64'),",
  "      mimeType: 'video/mp4',",
  "      fileName: videoId + '.mp4',",
  "      fileExtension: 'mp4'",
  "    }",
  "  }",
  "}];"
].join('\n');

ffmpegNode.parameters.jsCode = newCode;

const mainPayload = {
  name: main.name,
  nodes: main.nodes,
  connections: main.connections,
  settings: main.settings,
  staticData: main.staticData
};
fs.writeFileSync('./wf_main_ffmpeg.json', JSON.stringify(mainPayload));
console.log('Fix 2+3 saved → wf_main_ffmpeg.json');
console.log('  music download:', newCode.includes('musicFile'));
console.log('  stream_loop:', newCode.includes('stream_loop'));
console.log('  amix filter:', newCode.includes('amix'));
console.log('  code lines:', newCode.split('\n').length);

const fs = require('fs');
const wf = JSON.parse(fs.readFileSync('./wf_main_live.json', 'utf8'));

// ── 1. Remove Creatomate node ──────────────────────────────────────────────
wf.nodes = wf.nodes.filter(n => n.name !== 'Creatomate: Assemble Video');

// ── 2. FFmpeg Code node ────────────────────────────────────────────────────
const ffmpegCode = [
  "var childProcess = require('child_process');",
  "var fs2 = require('fs');",
  "var https2 = require('https');",
  "var http2 = require('http');",
  "var urlMod = require('url');",
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
  "    var parsed = urlMod.parse(fileUrl);",
  "    var mod = parsed.protocol === 'https:' ? https2 : http2;",
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
  "// Download audio",
  "var audioFile = tempDir + '/narration.mp3';",
  "await download(audioUrl, audioFile);",
  "",
  "// Download scenes",
  "var sceneFiles = [];",
  "for (var i = 0; i < scenes.length; i++) {",
  "  var sceneFile = tempDir + '/scene_' + String(i + 1).padStart(2, '0') + '.mp4';",
  "  await download(scenes[i].url, sceneFile);",
  "  sceneFiles.push(sceneFile);",
  "}",
  "",
  "// Concat list",
  "var concatList = tempDir + '/concat.txt';",
  "fs2.writeFileSync(concatList, sceneFiles.map(function(f) { return \"file '\" + f + \"'\"; }).join('\\n'));",
  "",
  "// Step 1: concat scenes",
  "var concatVideo = tempDir + '/scenes_concat.mp4';",
  "childProcess.execSync(",
  "  'ffmpeg -y -f concat -safe 0 -i \"' + concatList + '\" -c copy \"' + concatVideo + '\"',",
  "  { timeout: 180000 }",
  ");",
  "",
  "// Step 2: mix narration audio over video",
  "var finalVideo = tempDir + '/final.mp4';",
  "childProcess.execSync(",
  "  'ffmpeg -y -i \"' + concatVideo + '\" -i \"' + audioFile + '\" ' +",
  "  '-map 0:v:0 -map 1:a:0 ' +",
  "  '-c:v copy -c:a aac -b:a 128k ' +",
  "  '-shortest \"' + finalVideo + '\"',",
  "  { timeout: 180000 }",
  ");",
  "",
  "// Read final video as binary for Google Drive upload",
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

const nodeFFmpeg = {
  id: 'node-ffmpeg-assemble',
  name: 'FFmpeg: Assemble Video',
  type: 'n8n-nodes-base.code',
  typeVersion: 2,
  position: [1856, 576],
  parameters: {
    mode: 'runOnceForAllItems',
    jsCode: ffmpegCode
  }
};

// ── 3. Google Drive Upload node ────────────────────────────────────────────
const nodeDriveUpload = {
  id: 'node-drive-upload-final',
  name: 'Drive: Upload Final Video',
  type: 'n8n-nodes-base.googleDrive',
  typeVersion: 3,
  position: [2080, 576],
  parameters: {
    name: "={{ $('FFmpeg: Assemble Video').first().json.fileName }}",
    driveId: { __rl: true, mode: 'list', value: 'My Drive' },
    folderId: { __rl: true, mode: 'list', value: 'root', cachedResultName: '/ (Root folder)' },
    options: {}
  },
  credentials: {
    googleDriveOAuth2Api: {
      id: 'HN60vRphPZY9kxN2',
      name: 'Luccapavanallo'
    }
  }
};

// ── 4. Google Drive Share node ─────────────────────────────────────────────
const nodeDriveShare = {
  id: 'node-drive-share-final',
  name: 'Drive: Share Video Publicly',
  type: 'n8n-nodes-base.googleDrive',
  typeVersion: 3,
  position: [2304, 576],
  parameters: {
    operation: 'share',
    fileId: { __rl: true, value: '={{ $json.id }}', mode: 'id' },
    permissionsUi: {
      permissionsValues: { role: 'reader', type: 'anyone' }
    },
    options: {}
  },
  credentials: {
    googleDriveOAuth2Api: {
      id: 'HN60vRphPZY9kxN2',
      name: 'Luccapavanallo'
    }
  }
};

// ── 5. Format Output node (feeds Parse Assembly Output) ───────────────────
const nodeFormatOutput = {
  id: 'node-format-assembly-output',
  name: 'Format Assembly Output',
  type: 'n8n-nodes-base.code',
  typeVersion: 2,
  position: [2528, 576],
  parameters: {
    jsCode: [
      "var ffmpegData = $('FFmpeg: Assemble Video').first().json;",
      "var uploadData = $('Drive: Upload Final Video').first().json;",
      "var fileId = uploadData.id;",
      "var renderUrl = 'https://drive.google.com/uc?export=download&id=' + fileId;",
      "return [{",
      "  json: {",
      "    videoId: ffmpegData.videoId,",
      "    renderUrl: renderUrl,",
      "    renderId: fileId,",
      "    sceneCount: ffmpegData.sceneCount,",
      "    titulo: ffmpegData.titulo,",
      "    descricao: ffmpegData.descricao,",
      "    hashtags: ffmpegData.hashtags,",
      "    narracao: ffmpegData.narracao,",
      "    topic: ffmpegData.topic,",
      "    status: 'assembled'",
      "  }",
      "}];"
    ].join('\n')
  }
};

// ── 6. Add nodes ───────────────────────────────────────────────────────────
wf.nodes.push(nodeFFmpeg, nodeDriveUpload, nodeDriveShare, nodeFormatOutput);

// ── 7. Update connections ──────────────────────────────────────────────────
// Remove old Creatomate connections
delete wf.connections['Creatomate: Assemble Video'];

// Fix: Merge → FFmpeg (Merge previously connected to Creatomate via index 0)
// The Merge node should already have its connection updated to point to FFmpeg
// Check current Merge connections
for (const [from, cfg] of Object.entries(wf.connections)) {
  for (const arr of cfg.main || []) {
    for (const c of arr) {
      if (c.node === 'Creatomate: Assemble Video') {
        c.node = 'FFmpeg: Assemble Video';
        console.log('Updated connection:', from, '→ FFmpeg: Assemble Video');
      }
    }
  }
}

// FFmpeg → Drive Upload
wf.connections['FFmpeg: Assemble Video'] = {
  main: [[{ node: 'Drive: Upload Final Video', type: 'main', index: 0 }]]
};

// Drive Upload → Drive Share
wf.connections['Drive: Upload Final Video'] = {
  main: [[{ node: 'Drive: Share Video Publicly', type: 'main', index: 0 }]]
};

// Drive Share → Format Output
wf.connections['Drive: Share Video Publicly'] = {
  main: [[{ node: 'Format Assembly Output', type: 'main', index: 0 }]]
};

// Format Output → Parse Assembly Output
wf.connections['Format Assembly Output'] = {
  main: [[{ node: 'Parse Assembly Output', type: 'main', index: 0 }]]
};

// ── 8. Remove old Parse Assembly Output connection from Creatomate ─────────
// (already handled above — Creatomate had main → Parse Assembly Output,
//  now Format Assembly Output → Parse Assembly Output)

// ── 9. Save ───────────────────────────────────────────────────────────────
const payload = {
  name: wf.name,
  nodes: wf.nodes,
  connections: wf.connections,
  settings: wf.settings,
  staticData: wf.staticData
};
fs.writeFileSync('./wf_main_ffmpeg.json', JSON.stringify(payload));
console.log('Saved wf_main_ffmpeg.json');

// ── 10. Verify ────────────────────────────────────────────────────────────
const check = JSON.parse(fs.readFileSync('./wf_main_ffmpeg.json', 'utf8'));
const names = check.nodes.map(n => n.name);
console.log('\nNodes:', names);

const ffNode = check.nodes.find(n => n.name === 'FFmpeg: Assemble Video');
console.log('\nFFmpeg mode:', ffNode.parameters.mode);
console.log('FFmpeg code lines:', ffNode.parameters.jsCode.split('\n').length);

const connFrom = Object.entries(check.connections).filter(([k, v]) =>
  v.main && v.main.some(a => a.some && a.some(c => c.node === 'FFmpeg: Assemble Video'))
);
console.log('\nConnections → FFmpeg:', connFrom.map(([k]) => k));
console.log('FFmpeg →', check.connections['FFmpeg: Assemble Video']);
console.log('DriveUpload →', check.connections['Drive: Upload Final Video']);
console.log('DriveShare →', check.connections['Drive: Share Video Publicly']);
console.log('FormatOutput →', check.connections['Format Assembly Output']);

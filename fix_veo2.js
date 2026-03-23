const fs = require('fs');
const wf = JSON.parse(fs.readFileSync('./wf_veo2_live.json', 'utf8'));

// 1. Fix: All Scenes Ready — restaurar $getWorkflowStaticData e $input
wf.nodes.find(n => n.name === 'All Scenes Ready').parameters.jsCode = [
  "var staticData = $getWorkflowStaticData('global');",
  "var videoId = $input.first().json.videoId;",
  "var scenes = staticData[videoId] || [];",
  "// Limpar após leitura",
  "delete staticData[videoId];",
  "return [{",
  "  json: {",
  "    videoId: videoId,",
  "    totalScenes: scenes.length,",
  "    scenes: scenes,",
  "    status: 'all_scenes_ready'",
  "  }",
  "}];"
].join('\n');

// 2. Fix: Prepare Scenes — duracaoSegundos fixo em 6
const prepareNode = wf.nodes.find(n => n.name === 'Prepare Scenes');
prepareNode.parameters.jsCode = [
  "// Preparar cenas para geração via Veo 2",
  "const input = $input.first().json;",
  "const data = input.scriptData || input;",
  "const cenas = data.cenas || data.script?.cenas || [];",
  "",
  "const tempDir = `${'/home/node/.n8n/temp'}/${data.videoId}`;",
  "",
  "const fs = require('fs');",
  "fs.mkdirSync(tempDir, { recursive: true });",
  "",
  "const VISUAL_SUFFIX = ',divine golden light breaking through clouds, heavenly atmosphere, ancient Judea first century AD, cinematic composition, photorealistic, ultra detailed, no text overlay, no watermark, no modern elements, silent cinematic acting, no dialogue, quiet and peaceful scene';",
  "",
  "return cenas.map((cena, i) => ({",
  "  json: {",
  "    videoId: data.videoId,",
  "    cenaNumero: cena.numero || (i + 1),",
  "    duracaoSegundos: 6,",
  "    prompt: cena.prompt_imagem + VISUAL_SUFFIX,",
  "    tempDir,",
  "    outputFile: `${tempDir}/scene_${String(i + 1).padStart(2, '0')}.mp4`,",
  "    retryCount: 0",
  "  }",
  "}));"
].join('\n');

// 3. Fix: Veo 2 node — durationSeconds como número 6
const veoNode = wf.nodes.find(n => n.name === 'Veo 2: Start Generation1');
veoNode.parameters.options.durationSeconds = 6;

// 4. Fix: executionTimeout sem limite
wf.settings.executionTimeout = -1;

const payload = {
  name: wf.name,
  nodes: wf.nodes,
  connections: wf.connections,
  settings: wf.settings,
  staticData: wf.staticData
};

fs.writeFileSync('./wf_veo2_fixed2.json', JSON.stringify(payload));

// Verificar
const check = JSON.parse(fs.readFileSync('./wf_veo2_fixed2.json', 'utf8'));
const allReady = check.nodes.find(n => n.name === 'All Scenes Ready');
const prepare = check.nodes.find(n => n.name === 'Prepare Scenes');
const veo = check.nodes.find(n => n.name === 'Veo 2: Start Generation1');

console.log('All Scenes Ready — $getWorkflowStaticData ok:', allReady.parameters.jsCode.includes('$getWorkflowStaticData'));
console.log('All Scenes Ready — $input ok:', allReady.parameters.jsCode.includes('$input'));
console.log('Prepare Scenes — duracaoSegundos: 6:', prepare.parameters.jsCode.includes('duracaoSegundos: 6'));
console.log('Veo 2 — durationSeconds:', veo.parameters.options.durationSeconds, typeof veo.parameters.options.durationSeconds);
console.log('executionTimeout:', check.settings.executionTimeout);

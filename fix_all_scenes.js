const fs = require('fs');
const wf = JSON.parse(fs.readFileSync('./wf_veo2_now.json', 'utf8'));

const n = wf.nodes.find(n => n.name === 'All Scenes Ready');

// Reescrever para ler direto do $input (sem staticData, sem syntax issues)
// O input já tem os 4 itens de cena com videoUrl
n.parameters.jsCode = [
  "var items = $input.all();",
  "if (!items.length) throw new Error('No scene items received');",
  "",
  "var videoId = items[0].json.videoId;",
  "",
  "var scenes = items.map(function(item) {",
  "  return {",
  "    numero: item.json.cenaNumero,",
  "    duracao: item.json.duracaoSegundos,",
  "    url: item.json.videoUrl,",
  "    status: item.json.status",
  "  };",
  "});",
  "",
  "return [{",
  "  json: {",
  "    videoId: videoId,",
  "    totalScenes: scenes.length,",
  "    scenes: scenes,",
  "    status: 'all_scenes_ready'",
  "  }",
  "}];"
].join('\n');

console.log('=== Novo código All Scenes Ready ===');
console.log(n.parameters.jsCode);

const payload = {
  name: wf.name,
  nodes: wf.nodes,
  connections: wf.connections,
  settings: wf.settings,
  staticData: wf.staticData
};
fs.writeFileSync('./wf_veo2_allscenes.json', JSON.stringify(payload));
console.log('\nPayload salvo.');

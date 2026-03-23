const fs = require('fs');
const wf = JSON.parse(fs.readFileSync('./wf_audio2.json', 'utf8'));
const n = wf.nodes.find(n => n.name === 'Prepare Audio Dir');

// Código corrigido com regex numa única linha (sem newline literal)
n.parameters.jsCode = [
  "const fs2 = require('fs');",
  "const input = $input.first().json;",
  "const data = input.audioData || input;",
  "const ELEVENLABS_API_KEY = input.ELEVENLABS_API_KEY || data.ELEVENLABS_API_KEY;",
  "",
  "const videoId = data.videoId;",
  "const tempDir = '/home/node/.n8n/temp/' + videoId;",
  "fs2.mkdirSync(tempDir, { recursive: true });",
  "",
  "let narracao = data.narracao || (data.script && data.script.narracao_completa) || '';",
  "",
  "narracao = narracao",
  "  .replace(/[\\u{1F300}-\\u{1FAFF}]/gu, '')",
  "  .replace(/[\\u2600-\\u27BF]/gu, '')",
  "  .replace(/[\\u201C\\u201D\\u00AB\\u00BB]/g, '\"')",
  "  .replace(/[\\u2018\\u2019]/g, \"'\")",
  "  .replace(/[\\u2014\\u2013]/g, ', ')",
  "  .replace(/[*]+/g, '')",
  "  .replace(/#[^ \\t\\r\\n]*/g, '')",
  "  .replace(/[\\[]/g, '').replace(/]/g, '')",
  "  .replace(/[ \\t\\r\\n]{2,}/g, ' ')",
  "  .trim();",
  "",
  "return [{",
  "  json: {",
  "    videoId,",
  "    narracao,",
  "    tempDir,",
  "    audioFile: tempDir + '/narration.mp3',",
  "    ELEVENLABS_API_KEY",
  "  }",
  "}];"
].join('\n');

const payload = {
  name: wf.name,
  nodes: wf.nodes,
  connections: wf.connections,
  settings: wf.settings,
  staticData: wf.staticData
};

fs.writeFileSync('./wf_audio2_fixed.json', JSON.stringify(payload));

// Verificar
const check = JSON.parse(fs.readFileSync('./wf_audio2_fixed.json', 'utf8'));
const fixed = check.nodes.find(n => n.name === 'Prepare Audio Dir');
const lines = fixed.parameters.jsCode.split('\n');
console.log('Total linhas:', lines.length);
console.log('Linha regex hashtag:', lines.find(l => l.includes('#')));
console.log('Linha regex whitespace:', lines.find(l => l.includes('{2,}')));
console.log('Nenhuma linha quebrada:', !lines.some(l => l.includes('\r')));

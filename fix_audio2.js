const fs = require('fs');
const audio = JSON.parse(fs.readFileSync('C:/Users/Usuario/nicho-cristao/chk_audio.json','utf8'));
const prepA = audio.nodes.find(n => n.name === 'Prepare Audio Dir');

// Use backslash-free regex alternatives to survive n8n's JSON string storage
const fixedCode = `const fs2 = require('fs');
const input = $input.first().json;
const data = input.audioData || input;
const ELEVENLABS_API_KEY = input.ELEVENLABS_API_KEY || data.ELEVENLABS_API_KEY;

const videoId = data.videoId;
const tempDir = '/home/node/.n8n/temp/' + videoId;
fs2.mkdirSync(tempDir, { recursive: true });

let narracao = data.narracao || (data.script && data.script.narracao_completa) || '';

narracao = narracao
  .replace(/[\u{1F300}-\u{1FAFF}]/gu, '')
  .replace(/[\u{2600}-\u{27BF}]/gu, '')
  .replace(/[\u201C\u201D\u00AB\u00BB]/g, '"')
  .replace(/[\u2018\u2019]/g, "'")
  .replace(/[\u2014\u2013]/g, ', ')
  .replace(/[*]+/g, '')
  .replace(/#[^ \t\n\r]*/g, '')
  .replace(/[[\]]/g, '')
  .replace(/[ \t\n\r]{2,}/g, ' ')
  .trim();

return [{
  json: {
    videoId,
    narracao,
    tempDir,
    audioFile: tempDir + '/narration.mp3',
    ELEVENLABS_API_KEY
  }
}];`;

prepA.parameters.jsCode = fixedCode;

const payload = {
  name: audio.name,
  nodes: audio.nodes,
  connections: audio.connections,
  settings: audio.settings,
  staticData: audio.staticData || null
};
fs.writeFileSync('C:/Users/Usuario/nicho-cristao/chk_audio_fix2.json', JSON.stringify(payload));
console.log('✓ Audio fix2 ready - code length:', fixedCode.length);
console.log('Checking key patterns:');
console.log('  [*]+:', fixedCode.includes('[*]+'));
console.log('  #[^ :', fixedCode.includes('#[^ '));
console.log('  [[\\]]:', fixedCode.includes('[[\]]'));
console.log('  [ \\t\\n\\r]{2,}:', fixedCode.includes('[ \t\n\r]{2,}'));

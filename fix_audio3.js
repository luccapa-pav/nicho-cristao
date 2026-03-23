const fs = require('fs');
const audio = JSON.parse(fs.readFileSync('C:/Users/Usuario/nicho-cristao/chk_audio.json','utf8'));
const prepA = audio.nodes.find(n => n.name === 'Prepare Audio Dir');

// Use entirely backslash-free regex alternatives
// For brackets: two separate replacements - /[[]/ matches [ ; /]/ matches ]
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
  .replace(/[[]/g, '').replace(/]/g, '')
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
fs.writeFileSync('C:/Users/Usuario/nicho-cristao/chk_audio_fix3.json', JSON.stringify(payload));

// Verify no problematic patterns
const checks = [
  ['[*]+', true],
  ['#[^ ', true],
  ['[[]]', false],  // BAD: matches pair [] not individuals
  ['/[[]/g', true], // GOOD: matches single [
  [']/g', true],    // GOOD: matches single ]
];
console.log('Checks:');
checks.forEach(([pat, shouldHave]) => {
  const has = fixedCode.includes(pat);
  const ok = has === shouldHave;
  console.log(`  ${ok ? '✓' : '✗'} "${pat}": ${has} (expected ${shouldHave})`);
});
console.log('✓ Audio fix3 ready - code length:', fixedCode.length);

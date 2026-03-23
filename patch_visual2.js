const fs = require('fs');

const wf = JSON.parse(fs.readFileSync('C:/Users/Usuario/nicho-cristao/wf_pi_main_live.json', 'utf8'));
console.log('Live nodes:', wf.nodes.length, '| First 4:', wf.nodes.slice(0,4).map(n=>n.id).join(', '));

const ffmpegCode = fs.readFileSync('C:/Users/Usuario/nicho-cristao/ffmpeg_pi_v2.js', 'utf8');

const ffmpegNode = wf.nodes.find(n => n.id === 'pi-main-ffmpeg');
ffmpegNode.parameters.jsCode = ffmpegCode;
ffmpegNode.typeVersion = 2;

console.log('\nChecks:');
console.log('  $input          :', ffmpegCode.includes('$input'));
console.log('  splitIntoLines  :', ffmpegCode.includes('splitIntoLines'));
console.log('  Cinzel font     :', ffmpegCode.includes('Cinzel-Bold'));
console.log('  zoompan hook    :', ffmpegCode.includes('zoompan'));
console.log('  colorbalance    :', ffmpegCode.includes('colorbalance'));
console.log('  eq (hook grade) :', ffmpegCode.includes('eq=saturation'));
console.log('  vinheta drawbox :', ffmpegCode.includes("between(t,0,3)"));
console.log('  white flash t=3 :', ffmpegCode.includes('white@0.85'));
console.log('  alpha fade      :', ffmpegCode.includes('alpha='));
console.log('  lower third     :', ffmpegCode.includes('(h*78)/100') || ffmpegCode.includes('(h*74)/100'));
console.log('  SFX             :', ffmpegCode.includes('sfxOk'));
console.log('  afade           :', ffmpegCode.includes('afade'));
console.log('  HOOK_DUR=3      :', ffmpegCode.includes('HOOK_DUR = 3'));
console.log('  FADE=0.7        :', ffmpegCode.includes('FADE = 0.7'));

const payload = {
  name: wf.name,
  nodes: wf.nodes,
  connections: wf.connections,
  settings: wf.settings || {},
  staticData: wf.staticData || null
};
fs.writeFileSync('C:/Users/Usuario/nicho-cristao/wf_pi_main_payload.json', JSON.stringify(payload));
console.log('\nPayload saved. Nodes:', wf.nodes.length);

const fs = require('fs');

const wf = JSON.parse(fs.readFileSync('C:/Users/Usuario/nicho-cristao/wf_pi_main_live.json', 'utf8'));
console.log('Live nodes:', wf.nodes.length, '| First 4:', wf.nodes.slice(0,4).map(n=>n.id).join(', '));

// ── 1. FFmpeg: watermark + KB 3 variantes ─────────────────────────────────
const ffmpegNode = wf.nodes.find(n => n.id === 'pi-main-ffmpeg');
const ffmpegCode = fs.readFileSync('C:/Users/Usuario/nicho-cristao/ffmpeg_pi_v2.js', 'utf8');
ffmpegNode.parameters.jsCode = ffmpegCode;
ffmpegNode.typeVersion = 2;
console.log('\nFFmpeg checks:');
console.log('  watermark     :', ffmpegCode.includes('watermark'));
console.log('  KB_VARIANTS   :', ffmpegCode.includes('KB_VARIANTS'));
console.log('  zoom-out 1.5  :', ffmpegCode.includes('1.5,max'));
console.log('  celestial y=0 :', ffmpegCode.includes("y: '0'"));
console.log('  colorbalance  :', ffmpegCode.includes('colorbalance'));

// ── 2. Gemini: temperatura dinâmica por categoria ─────────────────────────
const geminiNode = wf.nodes.find(n => n.id === 'pi-main-gemini');
const newBody = fs.readFileSync('C:/Users/Usuario/nicho-cristao/gemini_body_v2.txt', 'utf8');
geminiNode.parameters.jsonBody = newBody;
console.log('\nGemini checks:');
console.log('  tempMap       :', newBody.includes('tempMap'));
console.log('  temp 1.1      :', newBody.includes('1.1'));
console.log('  temp 0.7      :', newBody.includes('0.7'));
console.log('  dynamic temp  :', newBody.includes('"temperature": temperature'));

// ── 3. Format PI Inputs: adicionar watermark no output ────────────────────
const fmtNode = wf.nodes.find(n => n.id === 'pi-main-format');
if (!fmtNode.parameters.jsCode.includes('watermark')) {
  fmtNode.parameters.jsCode = fmtNode.parameters.jsCode.replace(
    "ctaText: imageData.json.ctaText || originalData.ctaText || '',",
    "ctaText: imageData.json.ctaText || originalData.ctaText || '',\n    watermark: imageData.json.watermark || originalData.watermark || '',"
  );
}
console.log('\nFormat PI Inputs:');
console.log('  has watermark :', fmtNode.parameters.jsCode.includes('watermark'));

// ── 4. Verificar nodes protegidos ─────────────────────────────────────────
const PROTECTED = ['pi-main-schedule','pi-main-webhook','pi-main-set-config','pi-main-gemini'];
console.log('\nProtected present:', PROTECTED.every(id => wf.nodes.some(n => n.id === id)));

// ── 5. Salvar payload ──────────────────────────────────────────────────────
const payload = {
  name: wf.name,
  nodes: wf.nodes,
  connections: wf.connections,
  settings: wf.settings || {},
  staticData: wf.staticData || null
};
fs.writeFileSync('C:/Users/Usuario/nicho-cristao/wf_pi_main_payload.json', JSON.stringify(payload));
console.log('Payload saved. Nodes:', wf.nodes.length);

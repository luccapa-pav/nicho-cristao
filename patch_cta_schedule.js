const fs = require('fs');

const wf = JSON.parse(fs.readFileSync('C:/Users/Usuario/nicho-cristao/wf_pi_main_live.json', 'utf8'));
console.log('Live nodes:', wf.nodes.length, '| First 4:', wf.nodes.slice(0,4).map(n=>n.id).join(', '));

// ── 1. Atualizar Select Category: rotation + CTA pool ─────────────────────
const catNode = wf.nodes.find(n => n.id === 'pi-main-select-category');

catNode.parameters.jsCode = `const config = $input.first().json;

// ── Rotação semanal automática ────────────────────────────────────────────
// 0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sáb
// pornografia aparece 2x (Dom + Qua), demais 1x cada
const WEEKLY_ROTATION = [
  'pornografia', // Dom
  'poder',       // Seg
  'traicao',     // Ter
  'pornografia', // Qua (repeat)
  'vicio',       // Qui
  'odio',        // Sex
  'ganancia'     // Sáb
];

const rawCat = (config.categoria || 'auto').toLowerCase().trim();
const categoria = rawCat === 'auto' || !rawCat
  ? WEEKLY_ROTATION[new Date().getDay()]
  : rawCat;

// ── Categorias → prompt de cena Veo2 ────────────────────────────────────
const CATEGORIAS = {
  pornografia: {
    hookScenePrompt: 'Man alone late at night, face illuminated by phone screen with guilty expression of addiction and shame, dark room with cold blue digital light, slow motion close-up, cinematic vertical 9:16',
    hookTema: 'pornography addiction, digital darkness, shame and isolation'
  },
  poder: {
    hookScenePrompt: 'Corporate executive stepping over others to climb the ladder, close-up on hands pushing faces down, cold hard light, corporate thriller aesthetic, cinematic vertical 9:16',
    hookTema: 'toxic ambition, power addiction, betrayal of values'
  },
  traicao: {
    hookScenePrompt: 'Two hands secretly touching under a restaurant table, wedding ring clearly visible on one finger, low angle camera, complicit dim restaurant lighting, cinematic vertical 9:16',
    hookTema: 'infidelity, marital betrayal, destructive secrets'
  },
  vicio: {
    hookScenePrompt: 'Trembling hand opening a bottle at 7am, messy kitchen in background, harsh raw morning light, expression of desperate dependency, cinematic vertical 9:16',
    hookTema: 'alcohol and drug addiction, chemical dependency, family destruction'
  },
  odio: {
    hookScenePrompt: 'Man typing a hateful message on phone in total darkness, expression of twisted pleasure, red lateral light, aggressive fingers on keyboard close-up, cinematic vertical 9:16',
    hookTema: 'hatred, desire for revenge, bitterness that destroys the hater'
  },
  ganancia: {
    hookScenePrompt: 'Hands counting money while blurred family waits at dinner table in background, face ignoring children, cold light on money and warm light on the ignored family, cinematic vertical 9:16',
    hookTema: 'greed, money above everything, family abandonment for wealth'
  }
};

const cat = CATEGORIAS[categoria] || CATEGORIAS['pornografia'];

// ── Pool de CTAs: seguir/compartilhar centrado em Jesus ───────────────────
const CTA_POOL = [
  'Siga - Jesus tem mais pra voce',
  'Compartilhe: alguem precisa disso hoje',
  'Siga e nao perca a proxima revelacao',
  'Compartilhe - Jesus salva de verdade',
  'Siga: Deus ainda nao terminou com voce',
  'Compartilhe se cres no poder de Deus',
  'Siga - a proxima palavra e pra voce'
];
const ctaText = CTA_POOL[new Date().getDay() % CTA_POOL.length];

return [{
  json: {
    ...config,
    categoria,
    hookScenePrompt: cat.hookScenePrompt,
    hookTema: cat.hookTema,
    ctaText
  }
}];`;

console.log('Select Category updated');
console.log('  has WEEKLY_ROTATION:', catNode.parameters.jsCode.includes('WEEKLY_ROTATION'));
console.log('  has CTA_POOL:', catNode.parameters.jsCode.includes('CTA_POOL'));
console.log('  has auto rotation:', catNode.parameters.jsCode.includes("=== 'auto'"));

// ── 2. Atualizar Format PI Inputs: trocar referência para Select Category ──
const fmtNode = wf.nodes.find(n => n.id === 'pi-main-format');
fmtNode.parameters.jsCode = fmtNode.parameters.jsCode.replace(
  /\$\(["']Set Config PI["']\)/g,
  '$("Select Category")'
);
console.log('Format PI Inputs updated');
console.log('  references Select Category:', fmtNode.parameters.jsCode.includes('Select Category'));
console.log('  no longer references Set Config PI:', !fmtNode.parameters.jsCode.includes('Set Config PI'));

// ── 3. Verificar nodes protegidos presentes ────────────────────────────────
const PROTECTED = ['pi-main-schedule','pi-main-webhook','pi-main-set-config','pi-main-gemini'];
console.log('Protected present:', PROTECTED.every(id => wf.nodes.some(n => n.id === id)));
console.log('Nodes:', wf.nodes.length);

// ── 4. Salvar payload ──────────────────────────────────────────────────────
const payload = {
  name: wf.name,
  nodes: wf.nodes,
  connections: wf.connections,
  settings: wf.settings || {},
  staticData: wf.staticData || null
};
fs.writeFileSync('C:/Users/Usuario/nicho-cristao/wf_pi_main_payload.json', JSON.stringify(payload));
console.log('Payload saved.');

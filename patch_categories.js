const fs = require('fs');

const wf = JSON.parse(fs.readFileSync('C:/Users/Usuario/nicho-cristao/wf_pi_main_live.json', 'utf8'));
console.log('Live nodes:', wf.nodes.length, '| First 4:', wf.nodes.slice(0,4).map(n=>n.id).join(', '));

// ── 1. Novo node: Select Category ─────────────────────────────────────────
const categoryCode = `const config = $input.first().json;
const categoria = (config.categoria || 'pornografia').toLowerCase().trim();

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

return [{
  json: {
    ...config,
    categoria: categoria,
    hookScenePrompt: cat.hookScenePrompt,
    hookTema: cat.hookTema
  }
}];`;

const categoryNode = {
  id: 'pi-main-select-category',
  name: 'Select Category',
  type: 'n8n-nodes-base.code',
  typeVersion: 2,
  position: [992, 400],
  parameters: {
    jsCode: categoryCode
  }
};

// ── 2. Inserir novo node (antes do Gemini, index 4) ────────────────────────
// Manter primeiros 4 intocados, inserir após index 3
const first4 = wf.nodes.slice(0, 4);
const rest   = wf.nodes.slice(4);
wf.nodes = [...first4, categoryNode, ...rest];
console.log('Nodes after insert:', wf.nodes.length);

// ── 3. Atualizar Gemini jsonBody para usar hookScenePrompt dinâmico ────────
const geminiNode = wf.nodes.find(n => n.id === 'pi-main-gemini');
const newBody = fs.readFileSync('C:/Users/Usuario/nicho-cristao/gemini_body_v2.txt', 'utf8');
geminiNode.parameters.jsonBody = newBody;
console.log('Gemini updated | has hookScenePrompt:', newBody.includes('hookScenePrompt'));
console.log('Gemini updated | has hookScene concat:', newBody.includes('" + hookScene + "'));

// ── 4. Atualizar connections ───────────────────────────────────────────────
// Set Config PI → Select Category → Gemini (era Set Config PI → Gemini)
wf.connections['Set Config PI'] = {
  main: [[{ node: 'Select Category', type: 'main', index: 0 }]]
};
wf.connections['Select Category'] = {
  main: [[{ node: 'Generate Edit Concept (Gemini)', type: 'main', index: 0 }]]
};
console.log('Connections updated: Set Config PI → Select Category → Gemini');

// ── 5. Verificar primeiros 4 intocados ─────────────────────────────────────
const PROTECTED = ['pi-main-schedule','pi-main-webhook','pi-main-set-config','pi-main-gemini'];
const first4ids = wf.nodes.slice(0,4).map(n=>n.id);
// Gemini moved to index 4 after insert, but protected check is by presence not position
const allPresent = PROTECTED.every(id => wf.nodes.some(n => n.id === id));
console.log('All protected nodes present:', allPresent);
console.log('First 5 nodes:', wf.nodes.slice(0,5).map(n=>n.id).join(', '));

// ── 6. Salvar payload ──────────────────────────────────────────────────────
const payload = {
  name: wf.name,
  nodes: wf.nodes,
  connections: wf.connections,
  settings: wf.settings || {},
  staticData: wf.staticData || null
};
fs.writeFileSync('C:/Users/Usuario/nicho-cristao/wf_pi_main_payload.json', JSON.stringify(payload));
console.log('Payload saved. Total nodes:', wf.nodes.length);

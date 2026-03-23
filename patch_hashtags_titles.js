const fs = require('fs');

const wf = JSON.parse(fs.readFileSync('C:/Users/Usuario/nicho-cristao/wf_pi_main_live.json', 'utf8'));
console.log('Live nodes:', wf.nodes.length, '| First 4:', wf.nodes.slice(0,4).map(n=>n.id).join(', '));

// ═══════════════════════════════════════════════════════════════════════════
// #22 — Hashtags inteligentes por categoria
// ═══════════════════════════════════════════════════════════════════════════

// 22a. Select Category: adicionar hashtagsBase + hashtagsUniversal por categoria
const catNode = wf.nodes.find(n => n.id === 'pi-main-select-category');
catNode.parameters.jsCode = `const config = $input.first().json;

// ── Rotação semanal automática ────────────────────────────────────────────
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

// ── Categorias: prompt de cena + hashtags base ────────────────────────────
const CATEGORIAS = {
  pornografia: {
    hookScenePrompt: 'Man alone late at night, face illuminated by phone screen with guilty expression of addiction and shame, dark room with cold blue digital light, slow motion close-up, cinematic vertical 9:16',
    hookTema: 'pornography addiction, digital darkness, shame and isolation',
    hashtagsBase: ['#libertacao', '#pureza', '#vidasanta', '#renovacao', '#vencendoovicio', '#liberdadeemcristo']
  },
  poder: {
    hookScenePrompt: 'Corporate executive stepping over others to climb the ladder, close-up on hands pushing faces down, cold hard light, corporate thriller aesthetic, cinematic vertical 9:16',
    hookTema: 'toxic ambition, power addiction, betrayal of values',
    hashtagsBase: ['#ambicao', '#lideranca', '#proposito', '#femdeus', '#humildade', '#carreira']
  },
  traicao: {
    hookScenePrompt: 'Two hands secretly touching under a restaurant table, wedding ring clearly visible on one finger, low angle camera, complicit dim restaurant lighting, cinematic vertical 9:16',
    hookTema: 'infidelity, marital betrayal, destructive secrets',
    hashtagsBase: ['#casamento', '#restauracao', '#perdao', '#familia', '#amor', '#cura']
  },
  vicio: {
    hookScenePrompt: 'Trembling hand opening a bottle at 7am, messy kitchen in background, harsh raw morning light, expression of desperate dependency, cinematic vertical 9:16',
    hookTema: 'alcohol and drug addiction, chemical dependency, family destruction',
    hashtagsBase: ['#libertacao', '#sobriedade', '#cura', '#renovacao', '#transformacao', '#milagre']
  },
  odio: {
    hookScenePrompt: 'Man typing a hateful message on phone in total darkness, expression of twisted pleasure, red lateral light, aggressive fingers on keyboard close-up, cinematic vertical 9:16',
    hookTema: 'hatred, desire for revenge, bitterness that destroys the hater',
    hashtagsBase: ['#perdao', '#paz', '#amor', '#cura', '#libertacao', '#gracadedeus']
  },
  ganancia: {
    hookScenePrompt: 'Hands counting money while blurred family waits at dinner table in background, face ignoring children, cold light on money and warm light on the ignored family, cinematic vertical 9:16',
    hookTema: 'greed, money above everything, family abandonment for wealth',
    hashtagsBase: ['#proposito', '#abencado', '#prosperidade', '#familia', '#eternidade', '#riqueza']
  }
};

const HASHTAGS_UNIVERSAL = [
  '#jesus', '#cristao', '#fe', '#evangelico', '#deus',
  '#reelscristao', '#shortscristao', '#vidacristao'
];

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
    hashtagsBase: cat.hashtagsBase,
    hashtagsUniversal: HASHTAGS_UNIVERSAL,
    ctaText
  }
}];`;

console.log('#22 Select Category updated | has hashtagsBase:', catNode.parameters.jsCode.includes('hashtagsBase'));

// 22b + 23a. Parse Concept: merge hashtags + extrair titulo_yt
const parseNode = wf.nodes.find(n => n.id === 'pi-main-parse-concept');
parseNode.parameters.jsCode = `// 1. Obtém o JSON de entrada do Gemini
const resp = $input.first().json;
let raw = "";

try {
  raw = resp.candidates[0].content.parts[0].text.trim();
} catch (e) {
  throw new Error('Resposta do Gemini malformada: ' + e.message);
}

// 2. Limpeza de Markdown
raw = raw.replace(/^\`\`\`json\\s*/i, '')
         .replace(/^\`\`\`\\s*/i, '')
         .replace(/\`\`\`\\s*$/i, '')
         .trim();

let concept = null;
try {
  const parsed = JSON.parse(raw);
  concept = Array.isArray(parsed) ? parsed[0] : parsed;
} catch (e) {
  throw new Error('JSON inválido vindo do Gemini: ' + raw.substring(0, 300));
}

// 3. Busca configurações upstream
let prev = {};
try { prev = $("Set Config PI").first().json; } catch (e) {
  prev = { GOOGLE_AI_API_KEY: '', ELEVENLABS_API_KEY: '' };
}

// 4. Hashtags: base por categoria + Gemini + universais (sem duplicatas)
let catData = {};
try { catData = $("Select Category").first().json; } catch(e) {}
const hashtagsBase      = catData.hashtagsBase      || [];
const hashtagsUniversal = catData.hashtagsUniversal || [];
const hashtagsGemini    = concept.hashtags          || [];
const hashtags = [...new Set([...hashtagsBase, ...hashtagsGemini, ...hashtagsUniversal])];

// 5. ID único
const videoId = 'PI_' + new Date().toISOString().replace(/[-T:.Z]/g, '').substring(0, 14);

return [{
  json: {
    videoId,
    tema_jesus:        concept.tema_jesus        || '',
    versiculo:         concept.versiculo         || '',
    hook_prompt_video: concept.hook_prompt_video || '',
    imagens_prompts:   concept.imagens_prompts   || [],
    narracao:          concept.narracao          || '',
    ctaText:           concept.ctaText           || catData.ctaText || 'Siga - Jesus tem mais pra voce',
    titulo:            concept.titulo            || '',
    titulo_yt:         concept.titulo_yt         || '',
    descricao:         concept.descricao         || '',
    hashtags,
    frase_hook:        concept.frase_hook        || '',
    frase_jesus:       concept.frase_jesus       || '',
    GOOGLE_AI_API_KEY: prev.GOOGLE_AI_API_KEY    || '',
    ELEVENLABS_API_KEY:prev.ELEVENLABS_API_KEY   || '',
    status: 'concept_ready'
  }
}];`;

console.log('#22 Parse Concept updated | merge hashtags:', parseNode.parameters.jsCode.includes('hashtagsBase'));
console.log('#23 Parse Concept | titulo_yt:', parseNode.parameters.jsCode.includes('titulo_yt'));

// ═══════════════════════════════════════════════════════════════════════════
// #23 — Título duplo: Reels/TikTok + YouTube SEO
// ═══════════════════════════════════════════════════════════════════════════

// 23a. Gemini body: adicionar titulo_yt ao schema
const geminiNode = wf.nodes.find(n => n.id === 'pi-main-gemini');
const currentBody = geminiNode.parameters.jsonBody;
const updatedBody = currentBody.replace(
  '"titulo": "string PT-BR - titulo com emoji, max 60 chars",',
  '"titulo": "string PT-BR - titulo Reels/TikTok com emoji, max 60 chars, impactante",\n  "titulo_yt": "string PT-BR - titulo YouTube Shorts SEO, sem emoji, max 80 chars, keyword da tentacao + Jesus como solucao, ex: Como Vencer o Vicio da Pornografia Pelo Poder de Jesus",'
);
geminiNode.parameters.jsonBody = updatedBody;
console.log('#23 Gemini | titulo_yt in schema:', updatedBody.includes('titulo_yt'));

// 23b. Format PI Inputs: adicionar titulo_yt
const fmtNode = wf.nodes.find(n => n.id === 'pi-main-format');
if (!fmtNode.parameters.jsCode.includes('titulo_yt')) {
  fmtNode.parameters.jsCode = fmtNode.parameters.jsCode.replace(
    "titulo: imageData.json.titulo || originalData.titulo || '',",
    "titulo:    imageData.json.titulo    || originalData.titulo    || '',\n    titulo_yt: imageData.json.titulo_yt || originalData.titulo_yt || '',"
  );
}
console.log('#23 Format PI Inputs | titulo_yt:', fmtNode.parameters.jsCode.includes('titulo_yt'));

// ── Verificar nodes protegidos ─────────────────────────────────────────────
const PROTECTED = ['pi-main-schedule','pi-main-webhook','pi-main-set-config','pi-main-gemini'];
console.log('Protected present:', PROTECTED.every(id => wf.nodes.some(n => n.id === id)));

// ── Salvar payload ─────────────────────────────────────────────────────────
const payload = {
  name: wf.name, nodes: wf.nodes, connections: wf.connections,
  settings: wf.settings || {}, staticData: wf.staticData || null
};
fs.writeFileSync('C:/Users/Usuario/nicho-cristao/wf_pi_main_payload.json', JSON.stringify(payload));
console.log('PI Main payload saved. Nodes:', wf.nodes.length);

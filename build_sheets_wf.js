const fs = require('fs');
const wf = JSON.parse(fs.readFileSync('./wf_main_live2.json', 'utf8'));

// ── 1. Código do Agregar Temas ──────────────────────────────────
const agregadorCode = `// Pega config do Set Config
const cfg = $node['Set Config'].json;

// Coleta todos os temas já registrados na planilha
const allItems = $input.all();
const temasUsados = allItems
  .map(item => item.json['Tema'] || item.json['tema'] || '')
  .filter(t => String(t).trim().length > 0);

const temasUsadosStr = temasUsados.length > 0
  ? '\\n\\nTEMAS JÁ PRODUZIDOS (NÃO REPITA NENHUM DESTES):\\n'
    + temasUsados.map((t, i) => (i + 1) + '. ' + t).join('\\n')
  : '';

return [{ json: { ...cfg, temasUsados, temasUsadosStr } }];`;

// ── 2. Código simplificado do Parse Topics ──────────────────────
const parseCode = `var response = $input.first();
var cfg = $node['Set Config'].json;

var candidates = response.json.candidates;
var text = (candidates && candidates[0] && candidates[0].content && candidates[0].content.parts && candidates[0].content.parts[0])
  ? candidates[0].content.parts[0].text : '';

if (!text) throw new Error('Gemini returned no topics content');

var clean = text.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();

var topics;
try {
  topics = JSON.parse(clean);
} catch(e) {
  var match = clean.match(/\\[[\\s\\S]*\\]/);
  if (match) { topics = JSON.parse(match[0]); }
  else throw new Error('Invalid JSON from Gemini: ' + clean.substring(0, 200));
}

if (!Array.isArray(topics)) throw new Error('Not an array: ' + typeof topics);
if (topics.length === 0) throw new Error('Gemini returned 0 topics. Verifique o prompt.');

var runId = cfg.RUN_ID || new Date().toISOString().replace(/[^0-9]/g, '').substring(0, 14);

return topics.map(function(topic, i) {
  return {
    json: {
      milagre_de_jesus:  topic.milagre_de_jesus,
      versiculo_base:    topic.versiculo_base,
      gancho_inicial:    topic.gancho_inicial,
      palavras_chave:    topic.palavras_chave,
      categoria:         topic.categoria,
      runId:             runId,
      topicIndex:        i + 1,
      videoId:           runId + '_video_' + String(i + 1).padStart(2, '0'),
      GOOGLE_AI_API_KEY: cfg.GOOGLE_AI_API_KEY || '',
      ELEVENLABS_API_KEY: cfg.ELEVENLABS_API_KEY || ''
    }
  };
});`;

// ── 3. Novos nós ────────────────────────────────────────────────
const sheetsRead = {
  id: 'sheets-ler-temas',
  name: 'Sheets: Ler Temas Usados',
  type: 'n8n-nodes-base.googleSheets',
  typeVersion: 4.5,
  position: [460, 240],
  parameters: {
    operation: 'getRows',
    documentId: { __rl: true, value: 'COLE_O_ID_DA_PLANILHA_AQUI', mode: 'id' },
    sheetName:  { __rl: true, value: 'Temas', mode: 'name' },
    filtersUI: {},
    options: {}
  },
  credentials: { googleSheetsOAuth2Api: { id: '', name: 'Google Sheets' } }
};

const agregador = {
  id: 'agregar-temas',
  name: 'Agregar Temas Usados',
  type: 'n8n-nodes-base.code',
  typeVersion: 2,
  position: [660, 240],
  parameters: { jsCode: agregadorCode }
};

const sheetsWrite = {
  id: 'sheets-salvar-temas',
  name: 'Sheets: Salvar Novos Temas',
  type: 'n8n-nodes-base.googleSheets',
  typeVersion: 4.5,
  position: [880, 560],
  parameters: {
    operation: 'append',
    documentId: { __rl: true, value: 'COLE_O_ID_DA_PLANILHA_AQUI', mode: 'id' },
    sheetName:  { __rl: true, value: 'Temas', mode: 'name' },
    columns: {
      mappingMode: 'defineBelow',
      value: {
        Tema:      '={{ $json.milagre_de_jesus }}',
        Data:      '={{ $now.toFormat("yyyy-MM-dd") }}',
        RunID:     '={{ $json.runId }}',
        Versiculo: '={{ $json.versiculo_base }}',
        Categoria: '={{ $json.categoria }}'
      },
      matchingColumns: []
    },
    options: {}
  },
  credentials: { googleSheetsOAuth2Api: { id: '', name: 'Google Sheets' } }
};

// ── 4. Adiciona nós ─────────────────────────────────────────────
wf.nodes.push(sheetsRead, agregador, sheetsWrite);

// ── 5. Atualiza prompt do Generate Topics ───────────────────────
// jsonBody é uma expressão n8n (começa com =), tratar como string
const geminiNode = wf.nodes.find(n => n.name === 'Generate Topics (Gemini)');
// Injeta {{ $json.temasUsadosStr }} antes do fechamento do campo text no JSON inline
geminiNode.parameters.jsonBody = geminiNode.parameters.jsonBody.replace(
  ', n crie conteudos sobre o tanque de besteda"',
  ', n crie conteudos sobre o tanque de besteda{{ $json.temasUsadosStr }}"'
);

// ── 6. Simplifica Parse Topics ──────────────────────────────────
const parseNode = wf.nodes.find(n => n.name === 'Parse Topics');
parseNode.parameters.jsCode = parseCode;

// ── 7. Atualiza conexões ────────────────────────────────────────
// Set Config → Sheets: Ler (em vez de → Generate Topics)
wf.connections['Set Config'].main[0] = [
  { node: 'Sheets: Ler Temas Usados', type: 'main', index: 0 }
];

// Sheets: Ler → Agregar
wf.connections['Sheets: Ler Temas Usados'] = {
  main: [[{ node: 'Agregar Temas Usados', type: 'main', index: 0 }]]
};

// Agregar → Generate Topics
wf.connections['Agregar Temas Usados'] = {
  main: [[{ node: 'Generate Topics (Gemini)', type: 'main', index: 0 }]]
};

// Parse Topics → Sheets: Salvar (em vez de → Split In Batches)
wf.connections['Parse Topics'].main[0] = [
  { node: 'Sheets: Salvar Novos Temas', type: 'main', index: 0 }
];

// Sheets: Salvar → Split In Batches
wf.connections['Sheets: Salvar Novos Temas'] = {
  main: [[{ node: 'Split In Batches', type: 'main', index: 0 }]]
};

// ── 8. Salva ────────────────────────────────────────────────────
fs.writeFileSync('./wf_sheets_temas.json', JSON.stringify(wf, null, 2));

// ── 9. Validação ────────────────────────────────────────────────
const check = JSON.parse(fs.readFileSync('./wf_sheets_temas.json', 'utf8'));
const agg = check.nodes.find(n => n.name === 'Agregar Temas Usados');
const gem = check.nodes.find(n => n.name === 'Generate Topics (Gemini)');
const par = check.nodes.find(n => n.name === 'Parse Topics');

console.log('✓ Nodes total:', check.nodes.length);
console.log('\n── Agregar Temas (code preview) ──');
console.log(agg.parameters.jsCode.substring(0, 300));
console.log('\n── Gemini prompt (últimos 100 chars) ──');
const gemBody = gem.parameters.jsonBody;
console.log('...' + gemBody.slice(-120));
console.log('\n── Parse Topics (tem "usedTopics"?) ──');
console.log('Static data removed:', !par.parameters.jsCode.includes('usedTopics'));
console.log('\n── Conexões ──');
['Set Config','Sheets: Ler Temas Usados','Agregar Temas Usados','Parse Topics','Sheets: Salvar Novos Temas'].forEach(name => {
  const conn = check.connections[name];
  if(conn) console.log(name, '->', JSON.stringify(conn.main[0].map(c=>c.node)));
});

const fs = require('fs');
const wf = JSON.parse(fs.readFileSync('./wf_main.json', 'utf8'));

// Código do node "Prepare Topic Context"
const codeNodeJs = [
  "// Preparar contexto de tópicos já usados para o Gemini",
  "const input = $input.first().json;",
  "const store = $getWorkflowStaticData('global');",
  "const usedTopics = store.usedTopics || [];",
  "",
  "const usedTopicsText = usedTopics.length > 0",
  "  ? usedTopics.join(', ')",
  "  : 'nenhum ainda';",
  "",
  "const videosPerRun = input.VIDEOS_PER_RUN || 3;",
  "",
  "const promptText = `Você é um especialista em conteúdo cristão viral. Gere ${videosPerRun} tópicos únicos e variados em JSON para vídeos curtos sobre milagres e ensinamentos de Jesus. Responda APENAS com um array JSON, sem texto antes ou depois. Cada objeto deve ter: milagre_de_jesus (string), versiculo_base (string), gancho_inicial (frase impactante 3s), palavras_chave (array strings), categoria (milagre_cura|milagre_natureza|ensinamento|ressurreicao|parabola).",
  "",
  "REGRAS DE SEGURANÇA E SINCRONIA:",
  "1. CENSURA: NÃO use termos médicos ou nomes de deficiências (ex: paralítico, cego, leproso) nos títulos, ganchos ou palavras-chave para evitar bloqueios nas IAs de vídeo. Substitua por termos poéticos (ex: homem doente, buscando a luz, precisando de ajuda, cura divina).",
  "2. TEMPO: O gancho_inicial deve ser curto o suficiente para caber em exatamente 3 segundos de áudio (MÁXIMO de 6 a 8 palavras).",
  "3. GANCHO INICIAL (máx 8 palavras, causa CURIOSIDADE):",
  "- Use tensão temporal: Após X anos..., Em apenas 3 dias..., No momento em que...",
  "- Nunca revele o resultado no gancho — crie suspense",
  "- Exemplos RUINS: Jesus curou o homem doente (entrega tudo)",
  "- Exemplos BONS: Após 38 anos esperando..., Quando tudo parecia perdido...",
  "- PT-BR correto e natural, sem erros gramaticais",
  "",
  "TÓPICOS JÁ USADOS — NÃO REPITA NENHUM DELES (gere temas completamente diferentes):",
  "${usedTopicsText}`;",
  "",
  "// Montar o body completo como JSON válido (sem risco de quebrar)",
  "const geminiBody = JSON.stringify({",
  "  contents: [{ parts: [{ text: promptText }] }],",
  "  generationConfig: {",
  "    temperature: 0.8,",
  "    maxOutputTokens: 8192,",
  "    responseMimeType: 'application/json'",
  "  }",
  "});",
  "",
  "return [{ json: { ...input, geminiBody } }];"
].join('\n');

// Adicionar novo node
const newNode = {
  id: 'node-prepare-topic-ctx',
  name: 'Prepare Topic Context',
  type: 'n8n-nodes-base.code',
  typeVersion: 2,
  position: [440, 400],
  parameters: { jsCode: codeNodeJs }
};

wf.nodes.push(newNode);

// Redirecionar conexões: Set Config → Prepare Topic Context → Generate Topics
wf.connections['Set Config'].main[0] = [{ node: 'Prepare Topic Context', type: 'main', index: 0 }];
wf.connections['Prepare Topic Context'] = {
  main: [[{ node: 'Generate Topics (Gemini)', type: 'main', index: 0 }]]
};

// Atualizar Generate Topics: receber body como string pré-construída
const genNode = wf.nodes.find(n => n.name === 'Generate Topics (Gemini)');
genNode.parameters.specifyBody = 'string';
genNode.parameters.body = '={{ $json.geminiBody }}';
delete genNode.parameters.jsonBody;

const payload = {
  name: wf.name,
  nodes: wf.nodes,
  connections: wf.connections,
  settings: wf.settings,
  staticData: wf.staticData
};

fs.writeFileSync('./wf_main_v2.json', JSON.stringify(payload));

// Verificar
const check = JSON.parse(fs.readFileSync('./wf_main_v2.json', 'utf8'));
const codeN = check.nodes.find(n => n.name === 'Prepare Topic Context');
const genN = check.nodes.find(n => n.name === 'Generate Topics (Gemini)');

console.log('Code node jsCode ok:', codeN.parameters.jsCode.includes('$getWorkflowStaticData'));
console.log('Code node prompt ok:', codeN.parameters.jsCode.includes('usedTopicsText'));
console.log('Generate Topics specifyBody:', genN.parameters.specifyBody);
console.log('Generate Topics body:', genN.parameters.body);
console.log('jsonBody removido:', !genN.parameters.jsonBody);
console.log('Conexao Set Config:', JSON.stringify(check.connections['Set Config'].main[0]));
console.log('Conexao Prepare Topic Context:', JSON.stringify(check.connections['Prepare Topic Context'].main[0]));

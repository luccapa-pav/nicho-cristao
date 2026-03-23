const https = require('https');

const N8N_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzM2QzZDk5YS00NjMyLTQyMmItOTZkZi03ZTc5M2Y5YzMwZjUiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiY2RlNzMzM2MtMTJlMS00ZmJjLWE0OTItZDJhYjVkM2U5ZGE1IiwiaWF0IjoxNzczMTkwOTA0fQ.DI0te7DG89FQOywg1jdXRGbsV8udA-NuaEK88nvIYBs';

function n8nReq(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: 'n8n-n8n.yjlhot.easypanel.host', path, method,
      headers: { 'X-N8N-API-KEY': N8N_KEY, 'Content-Type': 'application/json' }
    };
    if (data) opts.headers['Content-Length'] = Buffer.byteLength(data);
    let out = '';
    const req = https.request(opts, res => {
      res.on('data', d => out += d);
      res.on('end', () => { try { resolve({ status: res.statusCode, body: JSON.parse(out) }); } catch(e) { resolve({ status: res.statusCode, body: out }); } });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

// ─── 1. Atualiza node-generate-topics: modelo + regras de gancho ───────────
async function fixGenerateTopics() {
  console.log('\n=== [1/2] Workflow principal zloYjCYLVf6BWhF9 ===');
  const wf = (await n8nReq('GET', '/api/v1/workflows/zloYjCYLVf6BWhF9')).body;

  // 1a. Modelo: gemini-2.0-flash → gemini-2.5-pro
  const topicsNode = wf.nodes.find(n => n.id === 'node-generate-topics');
  if (!topicsNode) throw new Error('node-generate-topics não encontrado');
  console.log('Node encontrado:', topicsNode.name);

  let changed = false;

  // Atualizar URL do modelo Gemini
  if (topicsNode.parameters.url && topicsNode.parameters.url.includes('gemini-2.0-flash')) {
    topicsNode.parameters.url = topicsNode.parameters.url.replace(
      'gemini-2.0-flash',
      'gemini-2.5-pro'
    );
    console.log('OK: URL atualizada para gemini-2.5-pro');
    changed = true;
  } else if (topicsNode.parameters.url && topicsNode.parameters.url.includes('gemini-2.5-pro')) {
    console.log('INFO: URL já usa gemini-2.5-pro, sem alteração necessária');
  } else {
    console.log('AVISO: URL do modelo não encontrada ou formato inesperado:', topicsNode.parameters.url);
  }

  // 1b. Adicionar regras de copywriting para gancho_inicial no prompt (jsonBody Gemini format)
  const GANCHO_RULES = '\n3. GANCHO INICIAL (máx 8 palavras, causa CURIOSIDADE):\\n- Use tensão temporal: "Após X anos...", "Em apenas 3 dias...", "No momento em que..."\\n- Nunca revele o resultado no gancho — crie suspense\\n- Exemplos RUINS: "Jesus curou o homem doente" (entrega tudo)\\n- Exemplos BONS: "Após 38 anos esperando...", "Quando tudo parecia perdido..."\\n- PT-BR correto e natural, sem erros gramaticais';

  const jb = topicsNode.parameters.jsonBody;
  if (jb) {
    if (jb.includes('GANCHO INICIAL')) {
      console.log('INFO: Regras de gancho já presentes no prompt');
    } else {
      // Inserir após a regra de TEMPO (item 2)
      const anchor = "2. TEMPO: O 'gancho_inicial' deve ser curto o suficiente para caber em exatamente 3 segundos de áudio (MÁXIMO de 6 a 8 palavras).";
      if (jb.includes(anchor)) {
        topicsNode.parameters.jsonBody = jb.replace(anchor, anchor + GANCHO_RULES);
        console.log('OK: Regras de gancho adicionadas ao jsonBody');
        changed = true;
      } else {
        console.log('AVISO: Âncora de TEMPO não encontrada. Trecho do jsonBody:');
        console.log(jb.substring(0, 400));
      }
    }
  }

  if (changed) {
    const res = await n8nReq('PUT', '/api/v1/workflows/zloYjCYLVf6BWhF9', {
      name: wf.name, nodes: wf.nodes, connections: wf.connections, settings: wf.settings
    });
    console.log('Status PUT:', res.status);
    if (res.status !== 200) console.log('Erro:', JSON.stringify(res.body).substring(0, 500));
    else console.log('OK: Workflow principal atualizado');
  } else {
    console.log('INFO: Nenhuma alteração necessária no workflow principal');
  }
}

// ─── 2. Atualiza "Prepare Prompt": regras de título e hook ─────────────────
async function fixPreparePrompt() {
  console.log('\n=== [2/2] Workflow de conteúdo 9tlW8BErnLH1ujOS ===');
  const wf = (await n8nReq('GET', '/api/v1/workflows/9tlW8BErnLH1ujOS')).body;

  const prepareNode = wf.nodes.find(n => n.name === 'Prepare Prompt');
  if (!prepareNode) throw new Error('Nó "Prepare Prompt" não encontrado');
  console.log('Node encontrado:', prepareNode.name, '| id:', prepareNode.id);

  const TITLE_HOOK_RULES = `- TÍTULO: Deve causar CURIOSIDADE e TENSÃO, nunca entregar o resultado.
  Estrutura ideal: [tempo/contexto dramático] + [situação] + [emoji]
  RUIM: "38 Anos Acabaram! A Cura Chegou!"
  BOM: "Após 38 Anos de Sofrimento... 🙏"
  Use PT-BR correto e fluente. Máx 60 chars.
- HOOK (cena 1): Deve fazer o espectador querer saber o que acontece.
  Proibido revelar o milagre na cena 1. Crie suspense.`;

  const jsCode = prepareNode.parameters.jsCode;
  if (!jsCode) throw new Error('jsCode não encontrado no nó Prepare Prompt');

  if (jsCode.includes('TÍTULO: Deve causar CURIOSIDADE')) {
    console.log('INFO: Regras de título/hook já presentes, sem alteração');
    return;
  }

  // Inserir após "REGRAS:" ou antes de "- 4 a 6 cenas" ou antes de "Responda APENAS"
  let newCode = jsCode;
  const anchors = [
    'REGRAS:\\\\n',
    'REGRAS:\\n',
    '- 4 a 6 cenas',
    'Responda APENAS com JSON'
  ];

  let inserted = false;
  for (const anchor of anchors) {
    if (jsCode.includes(anchor)) {
      newCode = jsCode.replace(anchor, anchor + TITLE_HOOK_RULES.replace(/\n/g, '\\n') + '\\n');
      inserted = true;
      console.log(`OK: Regras inseridas após âncora: "${anchor}"`);
      break;
    }
  }

  if (!inserted) {
    console.log('AVISO: Nenhuma âncora encontrada. Adicionando antes de "Responda APENAS" como fallback...');
    const fallback = 'Responda APENAS com JSON v';
    if (jsCode.includes(fallback)) {
      newCode = jsCode.replace(fallback, TITLE_HOOK_RULES.replace(/\n/g, '\\n') + '\\n' + fallback);
      inserted = true;
    }
  }

  if (!inserted) {
    console.log('ERRO: Não foi possível encontrar ponto de inserção. Exibindo trecho do código:');
    console.log(jsCode.substring(0, 400));
    return;
  }

  prepareNode.parameters.jsCode = newCode;

  const res = await n8nReq('PUT', '/api/v1/workflows/9tlW8BErnLH1ujOS', {
    name: wf.name, nodes: wf.nodes, connections: wf.connections, settings: wf.settings
  });
  console.log('Status PUT:', res.status);
  if (res.status !== 200) console.log('Erro:', JSON.stringify(res.body).substring(0, 500));
  else console.log('OK: Workflow de conteúdo atualizado com regras de título/hook');
}

async function main() {
  await fixGenerateTopics();
  await fixPreparePrompt();
  console.log('\n=== Concluído ===');
}

main().catch(e => console.error('ERRO:', e.message));

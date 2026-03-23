var fs = require('fs');
var main = JSON.parse(fs.readFileSync('C:/Users/Usuario/nicho-cristao/wf_pi_main_live.json', 'utf8'));

// Step 3a: Remove 4 nodes
var removeIds = ['pi-main-sheets-read', 'pi-main-agregar', 'pi-main-save-tema-prep', 'pi-main-sheets-save'];
var beforeCount = main.nodes.length;
main.nodes = main.nodes.filter(function(n){ return removeIds.indexOf(n.id) === -1; });
var afterCount = main.nodes.length;
console.log('Removed', beforeCount - afterCount, 'nodes. Remaining:', afterCount);
var stillHasSheets = main.nodes.some(function(n){ return n.id && n.id.indexOf('sheets') !== -1; });
console.log('Still has sheets nodes:', stillHasSheets);

// Step 3b: Update Gemini node body
var geminiNode = main.nodes.find(function(n){ return n.id === 'pi-main-gemini'; });
console.log('Gemini specifyBody:', geminiNode.parameters.specifyBody);
console.log('Gemini has jsonBody:', 'jsonBody' in geminiNode.parameters);

var newBody = '={{ JSON.stringify({"contents":[{"parts":[{"text":"Voce e um especialista em conteudo cristaO viral para o nicho evangelico brasileiro. Crie um conceito completo para um video no estilo PATTERN INTERRUPT. Responda APENAS com JSON valido, sem texto antes ou depois.\\n\\nESTRUTURA DO VIDEO (total ~26-28s):\\n- 4s: Hook de TENTACAO/PECADO (video Veo2) - INTERROMPE O SCROLL mostrando o que afasta de Deus\\n- 18-21s: Edit de Jesus/Deus em GLORIA MAJESTOSA com 5 a 7 imagens animadas Ken Burns - A REVELACAO\\n- Ultimos 4s: CTA em texto amarelo\\n\\nRETORNE EXATAMENTE ESTE JSON:\\n{\\n  \\"tema_jesus\\": \\"string - o poder/milagre/atributo divino revelado como resposta a tentacao\\",\\n  \\"versiculo\\": \\"string - versiculo biblico completo relacionado ao tema\\",\\n  \\"hook_prompt_video\\": \\"string EN - prompt Veo2 para cena de TENTACAO ou PECADO. Use uma destas: (1) Luxuria: silhouette of seductive woman in dim red light with smoke and mirrors, sinful atmosphere, vertical 9:16 | (2) Diabo: shadowy demonic figure with glowing red eyes emerging from darkness, hellish red glow, cinematic | (3) Vicios: person drowning in addiction surrounded by chaos, neon lights, despair | (4) Vaidade: person surrounded by luxury and emptiness, cold blue light, hollow expression | NUNCA use Jesus/God/Christ/cross/bible/church\\",\\n  \\"imagens_prompts\\": [\\"ENTRE 5 E 7 strings EN - personagem CONSISTENTE: man in ancient white robes, long dark hair, beard, SEMPRE rodeado de INTENSA luz dourada divina, poderoso, majestoso.\\"],\\n  \\"narracao\\": \\"string PT-BR - 50 a 70 palavras, ritmo pregacao evangelica URGENTE. Estrutura: (1) Nomeia tentacao/pecado (2) Revela poder de Deus (3) Instrucao engajamento (4) Oracao curta fechamento\\",\\n  \\"ctaText\\": \\"string PT-BR - 1 frase curta CTA\\",\\n  \\"titulo\\": \\"string PT-BR - titulo com emoji, max 60 chars\\",\\n  \\"descricao\\": \\"string PT-BR - 2 a 3 frases\\",\\n  \\"hashtags\\": [\\"hashtags PT-BR\\"]\\n}\\n\\nREGRAS: hook_prompt_video apenas ingles sem Jesus/God/Christ. imagens_prompts 5 a 7 imagens personagem CONSISTENTE com luz divina intensa. narracao menciona tentacao especifica + poder de Deus."}]}],"generationConfig":{"temperature":0.90,"maxOutputTokens":8192,"responseMimeType":"application/json"}}) }}';

geminiNode.parameters.jsonBody = newBody;
console.log('Updated gemini jsonBody, length:', newBody.length);

// Step 3c: Update Parse Concept jsCode
var parseNode = main.nodes.find(function(n){ return n.id === 'pi-main-parse-concept'; });

var newParseCode = [
  "var resp = $input.first().json;",
  "var raw = null;",
  "try {",
  "  raw = resp.candidates[0].content.parts[0].text.trim();",
  "} catch(e) { throw new Error('Gemini response malformed: ' + JSON.stringify(resp).substring(0, 200)); }",
  "",
  "var concept = null;",
  "raw = raw.replace(/^```json\\s*/i, '').replace(/^```\\s*/i, '').replace(/```\\s*$/i, '').trim();",
  "try { concept = JSON.parse(raw); } catch(e) { throw new Error('Invalid JSON from Gemini: ' + raw.substring(0, 300)); }",
  "",
  "var prev = $('Set Config PI').first().json;",
  "var videoId = 'PI_' + new Date().toISOString().replace(/[-T:.Z]/g, '').substring(0, 14);",
  "",
  "return [{",
  "  json: {",
  "    videoId: videoId,",
  "    tema_jesus: concept.tema_jesus || '',",
  "    versiculo: concept.versiculo || '',",
  "    hook_prompt_video: concept.hook_prompt_video || '',",
  "    imagens_prompts: concept.imagens_prompts || [],",
  "    narracao: concept.narracao || '',",
  "    ctaText: concept.ctaText || 'Me siga para nao perder sua bencao',",
  "    titulo: concept.titulo || '',",
  "    descricao: concept.descricao || '',",
  "    hashtags: concept.hashtags || [],",
  "    GOOGLE_AI_API_KEY: prev.GOOGLE_AI_API_KEY,",
  "    ELEVENLABS_API_KEY: prev.ELEVENLABS_API_KEY,",
  "    status: 'concept_ready'",
  "  }",
  "}];"
].join("\n");

// Verify $input and $('Set Config PI') are present
if (newParseCode.indexOf('$input') === -1) {
  throw new Error('ERROR: $input not found in parse jsCode!');
}
if (newParseCode.indexOf("Set Config PI") === -1) {
  throw new Error("ERROR: Set Config PI not found in parse jsCode!");
}
console.log("VERIFIED: $input and $('Set Config PI') present in parse jsCode");

parseNode.parameters.jsCode = newParseCode;

// Step 3d: Replace connections
var newConnections = {
  "Schedule Trigger": {"main": [[{"node": "Set Config PI", "type": "main", "index": 0}]]},
  "Webhook Trigger (Manual)": {"main": [[{"node": "Set Config PI", "type": "main", "index": 0}]]},
  "Set Config PI": {"main": [[{"node": "Generate Edit Concept (Gemini)", "type": "main", "index": 0}]]},
  "Generate Edit Concept (Gemini)": {"main": [[{"node": "Parse Concept", "type": "main", "index": 0}]]},
  "Parse Concept": {"main": [[{"node": "SUB: PI Hook Video", "type": "main", "index": 0}, {"node": "SUB: PI Jesus Images", "type": "main", "index": 0}, {"node": "SUB: Audio Generation", "type": "main", "index": 0}]]},
  "SUB: PI Hook Video": {"main": [[{"node": "Merge", "type": "main", "index": 0}]]},
  "SUB: PI Jesus Images": {"main": [[{"node": "Merge", "type": "main", "index": 1}]]},
  "SUB: Audio Generation": {"main": [[{"node": "Merge", "type": "main", "index": 2}]]},
  "Merge": {"main": [[{"node": "Format PI Inputs", "type": "main", "index": 0}]]},
  "Format PI Inputs": {"main": [[{"node": "FFmpeg: PI Assembly", "type": "main", "index": 0}]]},
  "FFmpeg: PI Assembly": {"main": [[{"node": "Drive: Upload PI Video", "type": "main", "index": 0}]]},
  "Drive: Upload PI Video": {"main": [[{"node": "Drive: Share PI Video Publicly", "type": "main", "index": 0}]]},
  "Drive: Share PI Video Publicly": {"main": [[{"node": "Parse PI Output", "type": "main", "index": 0}]]},
  "Parse PI Output": {"main": [[{"node": "SUB: Publicacao", "type": "main", "index": 0}]]}
};

main.connections = newConnections;
console.log('Connections replaced with', Object.keys(newConnections).length, 'entries');

// Build PUT payload
var payload = {
  name: main.name,
  nodes: main.nodes,
  connections: main.connections,
  settings: main.settings || {},
  staticData: main.staticData || null
};

// Final verifications
console.log('\n=== FINAL VERIFICATION ===');
console.log('Node count:', payload.nodes.length);
var sheetsNodes = payload.nodes.filter(function(n){ return n.name && n.name.toLowerCase().indexOf('sheet') !== -1; });
console.log('Sheets nodes remaining:', sheetsNodes.length);
var parseNodeFinal = payload.nodes.find(function(n){ return n.id === 'pi-main-parse-concept'; });
console.log('Parse jsCode has $input:', parseNodeFinal.parameters.jsCode.indexOf('$input') !== -1);
console.log('Parse jsCode has Set Config PI:', parseNodeFinal.parameters.jsCode.indexOf("Set Config PI") !== -1);
var geminiNodeFinal = payload.nodes.find(function(n){ return n.id === 'pi-main-gemini'; });
console.log('Gemini jsonBody starts with:', geminiNodeFinal.parameters.jsonBody.substring(0, 50));
console.log('No Sheets nodes in connections:', !('Sheets: Ler Temas PI' in payload.connections) && !('Agregar Temas PI' in payload.connections));

fs.writeFileSync('C:/Users/Usuario/nicho-cristao/wf_pi_main_put.json', JSON.stringify(payload));
console.log('PI Main PUT payload written');

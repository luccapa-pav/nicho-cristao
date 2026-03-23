const fs = require('fs');
const wf = JSON.parse(fs.readFileSync('C:/Users/Usuario/nicho-cristao/wf_pi_main_live.json','utf8'));

const PROTECTED = ['pi-main-schedule','pi-main-webhook','pi-main-set-config','pi-main-gemini'];

// ── 1. Update Gemini prompt — add frase_hook and frase_jesus to schema ────────
const geminiNode = wf.nodes.find(n => n.id === 'pi-main-gemini');
const oldHashtags = '\\\"hashtags\\\": [\\\"hashtags PT-BR\\\"]\\n}\\n\\nREGRAS:';
const newHashtags = '\\\"frase_hook\\\": \\\"string PT-BR - frase curta e impactante sobre a tentacao que aparece sobre a cena do hook (max 35 chars, ex: Nao se renda a isso...)\\\",\\n  \\\"frase_jesus\\\": \\\"string PT-BR - frase de transicao quando Jesus aparece (max 35 chars, ex: O Rei ainda esta aqui / Mas Deus...)\\\",\\n  \\\"hashtags\\\": [\\\"hashtags PT-BR\\\"]\\n}\\n\\nREGRAS:';
geminiNode.parameters.jsonBody = geminiNode.parameters.jsonBody.replace(oldHashtags, newHashtags);
geminiNode.parameters.jsonBody = geminiNode.parameters.jsonBody.replace(
  'narracao menciona tentacao especifica + poder de Deus.',
  'narracao menciona tentacao especifica + poder de Deus. frase_hook e frase_jesus em PT-BR max 35 chars cada, diretas e impactantes.'
);
console.log('✓ Gemini updated | has frase_hook:', geminiNode.parameters.jsonBody.includes('frase_hook'));

// ── 2. Update Parse Concept — extract frase_hook and frase_jesus ──────────────
const parseNode = wf.nodes.find(n => n.id === 'pi-main-parse-concept');
parseNode.parameters.jsCode = parseNode.parameters.jsCode.replace(
  "hashtags: concept.hashtags || [],",
  "hashtags: concept.hashtags || [],\n    frase_hook: concept.frase_hook || '',\n    frase_jesus: concept.frase_jesus || '',"
);
console.log('✓ Parse Concept updated | has frase_hook:', parseNode.parameters.jsCode.includes('frase_hook'));

// ── 3. Update Format PI Inputs — pass frase_hook and frase_jesus ──────────────
const formatNode = wf.nodes.find(n => n.id === 'pi-main-format');
formatNode.parameters.jsCode = formatNode.parameters.jsCode.replace(
  "GOOGLE_AI_API_KEY: imageData.json.GOOGLE_AI_API_KEY || originalData.GOOGLE_AI_API_KEY || ''",
  "GOOGLE_AI_API_KEY: imageData.json.GOOGLE_AI_API_KEY || originalData.GOOGLE_AI_API_KEY || '',\n    frase_hook:  imageData.json.frase_hook  || originalData.frase_hook  || '',\n    frase_jesus: imageData.json.frase_jesus || originalData.frase_jesus || ''"
);
console.log('✓ Format PI Inputs updated | has frase_hook:', formatNode.parameters.jsCode.includes('frase_hook'));

// ── 4. Update FFmpeg — add splitIntoLines helper + 2 drawtext overlays ────────
const ffmpegNode = wf.nodes.find(n => n.id === 'pi-main-ffmpeg');

const overlayBlock = "\n// Helper: quebra texto longo em linhas para nao sair da tela\nfunction splitIntoLines(text, maxChars) {\n  var t = escapeDrawtext(text || '');\n  if (t.length <= maxChars) return [t, ''];\n  var words = t.split(' ');\n  var line1 = '';\n  var line2 = '';\n  for (var wi = 0; wi < words.length; wi++) {\n    var candidate = line1 ? line1 + ' ' + words[wi] : words[wi];\n    if (candidate.length <= maxChars) {\n      line1 = candidate;\n    } else {\n      line2 = words.slice(wi).join(' ');\n      break;\n    }\n  }\n  return [line1, line2];\n}\n\n// Overlay 1: frase_hook (0-4s, centro da tela, fontsize=68)\nvar fraseHook  = data.frase_hook  || '';\nvar fraseJesus = data.frase_jesus || '';\nvar hookLines  = splitIntoLines(fraseHook,  22);\nvar jesusLines = splitIntoLines(fraseJesus, 30);\n\n";

const ctaInsertBefore = "var vfFilters = [];";
const insertAfterVfFilters = "var vfFilters = [];\n\n// Overlay 1: frase_hook (0-4s, centro, branco grande)\nif (hookLines[0]) vfFilters.push(\n  'drawtext=fontfile=' + fontPath +\n  ':text=\\'' + hookLines[0] + '\\''\n  + ':fontsize=68:fontcolor=white:bordercolor=black@0.8:borderw=5'\n  + ':x=(w-text_w)/2'\n  + ':y=' + (hookLines[1] ? '(h-text_h)/2-44' : '(h-text_h)/2')\n  + ':enable=\\'between(t,0,4)\\''\n);\nif (hookLines[1]) vfFilters.push(\n  'drawtext=fontfile=' + fontPath +\n  ':text=\\'' + hookLines[1] + '\\''\n  + ':fontsize=68:fontcolor=white:bordercolor=black@0.8:borderw=5'\n  + ':x=(w-text_w)/2'\n  + ':y=(h-text_h)/2+44'\n  + ':enable=\\'between(t,0,4)\\''\n);\n\n// Overlay 2: frase_jesus (t=4-8s, topo, branco medio)\nif (jesusLines[0]) vfFilters.push(\n  'drawtext=fontfile=' + fontPath +\n  ':text=\\'' + jesusLines[0] + '\\''\n  + ':fontsize=52:fontcolor=white:bordercolor=black@0.8:borderw=3'\n  + ':x=(w-text_w)/2'\n  + ':y=' + (jesusLines[1] ? '(h*10)/100' : '(h*11)/100')\n  + ':enable=\\'between(t,4,8)\\''\n);\nif (jesusLines[1]) vfFilters.push(\n  'drawtext=fontfile=' + fontPath +\n  ':text=\\'' + jesusLines[1] + '\\''\n  + ':fontsize=52:fontcolor=white:bordercolor=black@0.8:borderw=3'\n  + ':x=(w-text_w)/2'\n  + ':y=(h*10)/100+64'\n  + ':enable=\\'between(t,4,8)\\''\n);\n";

// Insert the splitIntoLines helper before escapeDrawtext
ffmpegNode.parameters.jsCode = ffmpegNode.parameters.jsCode.replace(
  "function escapeDrawtext(str) {",
  "function splitIntoLines(text, maxChars) {\n  var t = escapeDrawtext(text || '');\n  if (t.length <= maxChars) return [t, ''];\n  var words = t.split(' ');\n  var line1 = '';\n  var line2 = '';\n  for (var wi = 0; wi < words.length; wi++) {\n    var candidate = line1 ? line1 + ' ' + words[wi] : words[wi];\n    if (candidate.length <= maxChars) { line1 = candidate; }\n    else { line2 = words.slice(wi).join(' '); break; }\n  }\n  return [line1, line2];\n}\n\nfunction escapeDrawtext(str) {"
);

// Replace the vfFilters declaration to include the overlays after it
ffmpegNode.parameters.jsCode = ffmpegNode.parameters.jsCode.replace(
  "var vfFilters = [];",
  insertAfterVfFilters
);

// Add the variable declarations for fraseHook/fraseJesus before var vfFilters
// (they need to be before vfFilters but after ctaText is already defined)
ffmpegNode.parameters.jsCode = ffmpegNode.parameters.jsCode.replace(
  "var HOOK_DUR = 4;",
  "var fraseHook  = data.frase_hook  || '';\nvar fraseJesus = data.frase_jesus || '';\nvar hookLines  = splitIntoLines(fraseHook,  22);\nvar jesusLines = splitIntoLines(fraseJesus, 30);\n\nvar HOOK_DUR = 4;"
);

console.log('✓ FFmpeg updated');
console.log('  has splitIntoLines:', ffmpegNode.parameters.jsCode.includes('splitIntoLines'));
console.log('  has frase_hook:', ffmpegNode.parameters.jsCode.includes('frase_hook'));
console.log('  has between(t,0,4):', ffmpegNode.parameters.jsCode.includes('between(t,0,4)'));
console.log('  has between(t,4,8):', ffmpegNode.parameters.jsCode.includes('between(t,4,8)'));

// ── 5. Verify first 4 nodes untouched ─────────────────────────────────────────
const first4 = wf.nodes.slice(0,4).map(n => n.id);
console.log('✓ First 4 preserved:', PROTECTED.every(id => first4.includes(id)));

// ── 6. Save payload ───────────────────────────────────────────────────────────
const payload = { name: wf.name, nodes: wf.nodes, connections: wf.connections, settings: wf.settings || {}, staticData: wf.staticData || null };
fs.writeFileSync('C:/Users/Usuario/nicho-cristao/wf_pi_main_payload.json', JSON.stringify(payload));
console.log('Payload saved. Nodes:', wf.nodes.length);

const fs = require('fs');
const wf = JSON.parse(fs.readFileSync('./wf_main_live.json', 'utf8'));
const n = wf.nodes.find(n => n.name === 'Creatomate: Assemble Video');

const oldHeader = [
  "var httpsModule = require('https');",
  "",
  "var imageData = $('Sub: Gerar Vídeos').first().json;",
  "var audioData = $('SUB: Audio Generation (ElevenLabs)').first().json;",
  "var contentData = $('Sub: Generate Content').first().json;"
].join('\n');

const newHeader = [
  "var httpsModule = require('https');",
  "",
  "// Lê todos os items merged e identifica cada dataset pelo conteúdo",
  "var allItems = $input.all().map(function(i) { return i.json; });",
  "",
  "var imageData = allItems.find(function(d) { return d.scenes && d.scenes.length > 0; }) || {};",
  "var audioData = allItems.find(function(d) { return d.audioUrl; }) || {};",
  "var contentData = allItems.find(function(d) { return d.narracao || (d.script && d.script.narracao_completa); })",
  "  || allItems.find(function(d) { return d.titulo; }) || {};"
].join('\n');

n.parameters.jsCode = n.parameters.jsCode.replace(oldHeader, newHeader);

const ok = !n.parameters.jsCode.includes("$('Sub: Gerar Vídeos').first().json");
console.log('Fix aplicado:', ok);
if (!ok) {
  console.log('ERRO: substituição não funcionou. Verificando string original...');
  const idx = n.parameters.jsCode.indexOf("var imageData = ");
  console.log(JSON.stringify(n.parameters.jsCode.slice(idx-5, idx+100)));
  process.exit(1);
}

console.log('\nPrimeiras linhas:\n' + n.parameters.jsCode.split('\n').slice(0, 10).join('\n'));

const payload = {
  name: wf.name,
  nodes: wf.nodes,
  connections: wf.connections,
  settings: wf.settings,
  staticData: wf.staticData
};
fs.writeFileSync('./wf_main_creatomate.json', JSON.stringify(payload));
console.log('\nPayload salvo.');

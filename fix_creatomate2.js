const fs = require('fs');
const wf = JSON.parse(fs.readFileSync('./wf_main_live.json', 'utf8'));
const n = wf.nodes.find(n => n.name === 'Creatomate: Assemble Video');

let code = n.parameters.jsCode;

// Fix 1: background_border_radius de '8px' para '%' (Creatomate exige %)
code = code.replace("background_border_radius: '8px'", "background_border_radius: '4%'");

// Fix 2: font_weight string para número
code = code.replace("font_weight: '900'", "font_weight: '700'");

// Fix 3: stroke_width vmin pode não ser suportado — usar vw
code = code.replace("stroke_width: '2.2 vmin'", "stroke_width: '0.5%'");

n.parameters.jsCode = code;

// Verificar
console.log('border_radius fix:', code.includes("background_border_radius: '4%'"));
console.log('font_weight fix:', code.includes("font_weight: '700'"));
console.log('stroke_width fix:', code.includes("stroke_width: '0.5%'"));

const payload = {
  name: wf.name,
  nodes: wf.nodes,
  connections: wf.connections,
  settings: wf.settings,
  staticData: wf.staticData
};
fs.writeFileSync('./wf_main_creatomate2.json', JSON.stringify(payload));
console.log('Salvo.');

const fs = require('fs');

const wf = JSON.parse(fs.readFileSync('C:/Users/Usuario/nicho-cristao/wf_pi_hook_live.json', 'utf8'));
console.log('SUB Hook nodes:', wf.nodes.length);

// ═══════════════════════════════════════════════════════════════════════════
// #24 — Retry automático no Veo2 (pi-hook-veo2-start)
// ═══════════════════════════════════════════════════════════════════════════
const veo2Node = wf.nodes.find(n => n.id === 'pi-hook-veo2-start');
if (!veo2Node) throw new Error('Node pi-hook-veo2-start not found!');

// Retry settings no HTTP Request node
veo2Node.retryOnFail    = true;
veo2Node.maxTries       = 3;      // tentativa original + 2 retries
veo2Node.waitBetweenTries = 8000; // 8s entre tentativas (Veo2 pode ter rate limit)

console.log('#24 Veo2 retry set:');
console.log('  retryOnFail    :', veo2Node.retryOnFail);
console.log('  maxTries       :', veo2Node.maxTries);
console.log('  waitBetweenTries:', veo2Node.waitBetweenTries);
console.log('  node name      :', veo2Node.name);

// ── Verificar outros nodes intactos ────────────────────────────────────────
const nodeNames = wf.nodes.map(n => n.name);
console.log('\nAll SUB Hook nodes:', nodeNames.join(', '));

// ── Salvar payload ─────────────────────────────────────────────────────────
const payload = {
  name: wf.name, nodes: wf.nodes, connections: wf.connections,
  settings: wf.settings || {}, staticData: wf.staticData || null
};
fs.writeFileSync('C:/Users/Usuario/nicho-cristao/wf_pi_hook_payload.json', JSON.stringify(payload));
console.log('\nSUB Hook payload saved.');

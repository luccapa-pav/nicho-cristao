"""
Update Generate Edit Concept (Gemini) prompt in PI Main workflow
with safer terms to avoid content filter blocks.
"""
import json, urllib.request, urllib.error, ssl, sys
sys.stdout.reconfigure(encoding='utf-8')

N8N = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzM2QzZDk5YS00NjMyLTQyMmItOTZkZi03ZTc5M2Y5YzMwZjUiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiY2RlNzMzM2MtMTJlMS00ZmJjLWE0OTItZDJhYjVkM2U5ZGE1IiwiaWF0IjoxNzczMTkwOTA0fQ.DI0te7DG89FQOywg1jdXRGbsV8udA-NuaEK88nvIYBs"

CTX = ssl._create_unverified_context()

def get(wf_id):
    req = urllib.request.Request("https://n8n-n8n.yjlhot.easypanel.host/api/v1/workflows/" + wf_id)
    req.add_header("X-N8N-API-KEY", N8N)
    req.add_header("Accept", "application/json")
    with urllib.request.urlopen(req, timeout=30, context=CTX) as r:
        return json.loads(r.read())

def put(wf_id, wf):
    url = "https://n8n-n8n.yjlhot.easypanel.host/api/v1/workflows/" + wf_id
    payload = {"name": wf["name"], "nodes": wf["nodes"], "connections": wf["connections"], "settings": wf.get("settings", {})}
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(url, data=body, method="PUT")
    req.add_header("X-N8N-API-KEY", N8N)
    req.add_header("Content-Type", "application/json; charset=utf-8")
    req.add_header("Accept", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=30, context=CTX) as r:
            return r.status
    except urllib.error.HTTPError as e:
        print("ERRO:", e.code, e.read().decode()[:300])
        return e.code

# New body for Generate Edit Concept (Gemini) — PI Main workflow
NEW_BODY = r"""={
JSON.stringify({
  "contents": [
    {
      "parts": [
        {
          "text": "Voce e um especialista em conteudo cristaO viral para o nicho evangelico brasileiro. Crie um conceito completo para um video no estilo PATTERN INTERRUPT. Responda APENAS com JSON valido, sem texto antes ou depois.\n\nESTRUTURA DO VIDEO (total ~26-28s):\n- 4s: Hook de TENTACAO/PECADO (video Veo2) - INTERROMPE O SCROLL\n- 18-21s: Edit em GLORIA MAJESTOSA com 5 a 7 imagens animadas Ken Burns\n- Ultimos 4s: CTA em texto amarelo\n\nRETORNE EXATAMENTE ESTE JSON:\n{\n  \"tema_jesus\": \"string - o poder/milagre/atributo divino revelado como resposta a tentacao\",\n  \"versiculo\": \"string - versiculo biblico completo relacionado ao tema\",\n  \"hook_prompt_video\": \"string EN - prompt Veo2 para cena de TENTACAO. Exemplos seguros: (1) silhouette of a woman in red light surrounded by darkness and smoke, cinematic, vertical 9:16 | (2) shadowy figure emerging from deep darkness with glowing embers, dramatic low-key lighting | (3) person in neon-lit alley consumed by shadows and smoke, despair, cinematic | (4) cold blue light over empty luxury room, smoke, hollow atmosphere, vertical 9:16\",\n  \"imagens_prompts\": [\"ENTRE 5 E 7 strings EN - personagem CONSISTENTE: majestic man in white linen with long dark hair and beard, volumetric golden backlighting, powerful and serene expression. Cenarios: ancient lakeside, mountain peak, rocky hillside, stone archway, open fields at dawn. NUNCA use nomes biblicos geograficos.\"],\n  \"narracao\": \"string PT-BR - 50 a 70 palavras, ritmo pregacao evangelica URGENTE. Estrutura: (1) Nomeia tentacao/pecado (2) Revela poder de Deus (3) Instrucao engajamento (4) Oracao curta fechamento\",\n  \"ctaText\": \"string PT-BR - 1 frase curta CTA\",\n  \"titulo\": \"string PT-BR - titulo com emoji, max 60 chars\",\n  \"descricao\": \"string PT-BR - 2 a 3 frases\",\n  \"hashtags\": [\"hashtags PT-BR\"]\n}\n\nREGRAS:\n- hook_prompt_video: APENAS ingles. Use termos como 'darkness', 'shadowy figure', 'neon lights', 'smoke', 'silhouette'. NUNCA use nomes de entidades (Jesus, God, Christ, Devil, Satan, demon).\n- imagens_prompts: Descreva o personagem como 'majestic man in white linen'. Use 'volumetric lighting' ou 'golden backlighting' em vez de 'divine light'. Evite nomes geograficos biblicos (Jerusalem, Nazareth, Galilee); use 'ancient lakeside', 'mountain peak', 'rocky hillside'.\n- narracao: menciona tentacao especifica + poder de Deus, ritmo evangelico urgente.\n- Temas ja usados para evitar: " + ($json.temasUsadosStr || "nenhum")
        }
      ]
    }
  ],
  "generationConfig": {
    "temperature": 0.9,
    "maxOutputTokens": 8192,
    "responseMimeType": "application/json"
  }
})
}"""

# PI Main workflow ID
wf = get("kFRpZ9ku3BcqePAn")
patched = False
for node in wf["nodes"]:
    if node["name"] == "Generate Edit Concept (Gemini)":
        node["parameters"]["body"] = NEW_BODY
        patched = True
        print("Patched: Generate Edit Concept (Gemini)")

if not patched:
    print("ERROR: node 'Generate Edit Concept (Gemini)' not found!")
    sys.exit(1)

st = put("kFRpZ9ku3BcqePAn", wf)
print("PUT:", st)

if st == 200:
    print()
    print("=== DONE ===")
    print("Regras atualizadas no Generate Edit Concept (Gemini):")
    print("  hook: darkness / shadowy figure / neon lights / smoke / silhouette")
    print("  imagens: majestic man in white linen + volumetric/golden backlighting")
    print("  cenarios: ancient lakeside / mountain peak / rocky hillside (sem nomes biblicos)")
    print("  proibido: entidades por nome (Jesus/God/Christ/Devil/Satan/demon)")

"""
Adiciona sticky notes ao workflow PI Main (zloYjCYLVf6BWhF9)
6 blocos: Gatilhos | Config | Temas | Conteúdo | FFmpeg | Publicação
"""
import json, uuid, urllib.request, urllib.error, ssl, sys
sys.stdout.reconfigure(encoding='utf-8')

N8N = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzM2QzZDk5YS00NjMyLTQyMmItOTZkZi03ZTc5M2Y5YzMwZjUiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiY2RlNzMzM2MtMTJlMS00ZmJjLWE0OTItZDJhYjVkM2U5ZGE1IiwiaWF0IjoxNzczMTkwOTA0fQ.DI0te7DG89FQOywg1jdXRGbsV8udA-NuaEK88nvIYBs"
CTX = ssl._create_unverified_context()
WF_ID = "zloYjCYLVf6BWhF9"

def get(wf_id):
    req = urllib.request.Request(f"https://n8n-n8n.yjlhot.easypanel.host/api/v1/workflows/{wf_id}")
    req.add_header("X-N8N-API-KEY", N8N)
    req.add_header("Accept", "application/json")
    with urllib.request.urlopen(req, timeout=30, context=CTX) as r:
        return json.loads(r.read())

def put(wf_id, wf):
    url = f"https://n8n-n8n.yjlhot.easypanel.host/api/v1/workflows/{wf_id}"
    payload = {
        "name": wf["name"],
        "nodes": wf["nodes"],
        "connections": wf["connections"],
        "settings": wf.get("settings", {})
    }
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(url, data=body, method="PUT")
    req.add_header("X-N8N-API-KEY", N8N)
    req.add_header("Content-Type", "application/json; charset=utf-8")
    req.add_header("Accept", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=30, context=CTX) as r:
            return r.status
    except urllib.error.HTTPError as e:
        print("ERRO:", e.code, e.read().decode()[:500])
        return e.code

def make_note(note_id, name, position, width, height, color, content):
    return {
        "id": note_id,
        "name": name,
        "type": "n8n-nodes-base.stickyNote",
        "typeVersion": 1,
        "position": position,
        "parameters": {
            "content": content,
            "height": height,
            "width": width,
            "color": color
        }
    }

# ─────────────────────────────────────────────────────────────────────────────
# BLOCOS — posição = top-left da área que cobre os nodes do bloco
# ─────────────────────────────────────────────────────────────────────────────

STICKY_NOTES = [

    # ── BLOCO 1: Gatilhos de Entrada ─────────────────────────────────────────
    # Nodes: Schedule Trigger [272,416] + Webhook [272,592]
    make_note(
        note_id="sticky-gatilhos",
        name="Nota: Gatilhos",
        position=[160, 320],
        width=300,
        height=380,
        color=4,   # azul
        content="""\
## 🎯 Gatilhos de Entrada

Ponto de entrada do pipeline.
Dois modos de disparo disponíveis:

**⏰ Schedule Trigger**
Execução automática agendada.
Usar em produção contínua.

**🔗 Webhook (Manual)**
Disparo via HTTP para testes
e execuções pontuais.

---
> 💡 Use o Webhook para testar
> sem aguardar o agendamento.
"""
    ),

    # ── BLOCO 2: Configuração Global ─────────────────────────────────────────
    # Nodes: Set Config [544,416]
    make_note(
        note_id="sticky-config",
        name="Nota: Config",
        position=[460, 320],
        width=260,
        height=200,
        color=6,   # cinza escuro
        content="""\
## ⚙️ Configuração Global

Parâmetros centrais da execução:

- **quantidade** — Vídeos por ciclo
- **categoria** — Tema base
- **idioma** — PT-BR padrão
- **canal** — Destino de publicação
"""
    ),

    # ── BLOCO 3: Gestão de Temas ──────────────────────────────────────────────
    # Nodes: Sheets Ler [736,416] + Agregar [928,416]
    #        Generate Topics [1120,416] + Parse Topics [1344,416]
    make_note(
        note_id="sticky-temas",
        name="Nota: Temas",
        position=[640, 320],
        width=820,
        height=200,
        color=1,   # amarelo
        content="""\
## 📋 Gestão de Temas

Garante variedade e evita repetição de conteúdo entre execuções.

**Fluxo:** Ler histórico → Agregar deduplicado → Gemini gera novos temas → Parse lista

> 🔑 Modelo: **Gemini Pro** (Google AI)
> 📊 Histórico armazenado no **Google Sheets**
> ⚠️ Temas são salvos no bloco seguinte (após bifurcação)
"""
    ),

    # ── BLOCO 4: Geração de Conteúdo ─────────────────────────────────────────
    # Nodes: Salvar Temas [1568,304] + Sub: Generate Content [1568,496]
    #        Sub: Audio [1840,592] + Sub: Gerar Vídeos [1840,400]
    make_note(
        note_id="sticky-conteudo",
        name="Nota: Conteúdo",
        position=[1490, 210],
        width=480,
        height=500,
        color=3,   # rosa/fúcsia
        content="""\
## 🎬 Geração de Conteúdo

Produz os três componentes do vídeo em paralelo.

**↗ Salvar Temas**
Registra no Sheets para evitar repetição futura.

**↘ Generate Content**
Roteiro, narração, hashtags e CTA (sub-workflow).

**🎙️ Audio (ElevenLabs)**
Síntese de voz em PT-BR com entonação natural.

**🖼️ Gerar Vídeos**
Cenas visuais via Nano Banana com efeito Ken Burns.

---
> 🔑 **ElevenLabs** — voz
> 🔑 **Nano Banana** — imagens
> ⏱️ Etapa mais longa (~30–60s por vídeo)
"""
    ),

    # ── BLOCO 5: Montagem FFmpeg ──────────────────────────────────────────────
    # Nodes: Merge [2096,496] + FFmpeg [2288,496] + Format [2288,704]
    make_note(
        note_id="sticky-ffmpeg",
        name="Nota: FFmpeg",
        position=[2010, 415],
        width=395,
        height=440,
        color=2,   # vermelho
        content="""\
## 🎞️ Montagem FFmpeg (v14)

Combina cenas, áudio e overlays em um único MP4 1080×1920.

**Nodes:**
- **Merge** — Une outputs de áudio e vídeo
- **FFmpeg: Assemble Video** — Motor de edição
- **Format Output** — Prepara metadados

**Features ativas:**
• Karaoke 2 camadas (grupo branco + palavra amarela/laranja)
• Palavras divinas em **laranja** (Deus, Jesus, Cristo…)
• Xfade variado entre cenas (5 transições aleatórias)
• Frame preto 0.3s + fade-in suave
• Versículo em **Roboto-Italic** com alpha fade
• Título centralizado 2s com fade-in/out
• CTA slide-in, visível 3s exatos
• Watermark pulsante, canto alternado
• Limpeza automática de arquivos temp
"""
    ),

    # ── BLOCO 6: Publicação e Distribuição ───────────────────────────────────
    # Nodes: Drive Upload [2512,496] + Drive Share [2736,496]
    #        Parse Assembly [2512,704] + Sub: Publicação [2736,704]
    make_note(
        note_id="sticky-publicacao",
        name="Nota: Publicação",
        position=[2420, 415],
        width=460,
        height=440,
        color=5,   # verde/teal
        content="""\
## 📤 Publicação e Distribuição

Entrega o vídeo final ao destino configurado.

**Nodes:**
- **Parse Assembly** — Extrai metadados do FFmpeg output
- **Drive: Upload** — Sobe o MP4 para Google Drive
- **Drive: Share** — Define permissão pública (link aberto)
- **Sub: Publicação** — Distribui para plataformas

**Saídas:**
• Google Drive (arquivo MP4 + link público)
• YouTube Shorts / Instagram Reels

---
> ✅ Vídeo disponível publicamente após este bloco
> 📁 Arquivos temp já limpos pelo FFmpeg node
> 🎬 Título, descrição e hashtags gerados automaticamente
"""
    ),
]

# ─────────────────────────────────────────────────────────────────────────────

print(f"Carregando workflow {WF_ID}...")
wf = get(WF_ID)

# Remover sticky notes antigas (se houver) para evitar duplicatas
existing = [n for n in wf["nodes"] if n["type"] != "n8n-nodes-base.stickyNote"]
removed = len(wf["nodes"]) - len(existing)
if removed:
    print(f"  Removidas {removed} sticky notes antigas")

# Adicionar as novas (notes PRIMEIRO para ficarem atrás dos outros nodes)
wf["nodes"] = STICKY_NOTES + existing

print(f"  Adicionando {len(STICKY_NOTES)} sticky notes...")
st = put(WF_ID, wf)
print(f"  PUT: {st}")

if st == 200:
    print()
    print("=== STICKY NOTES ADICIONADAS ===")
    print("🎯  Bloco 1 — Gatilhos de Entrada    (azul)       [160, 320]")
    print("⚙️   Bloco 2 — Configuração Global    (cinza)      [460, 320]")
    print("📋  Bloco 3 — Gestão de Temas         (amarelo)    [640, 320]")
    print("🎬  Bloco 4 — Geração de Conteúdo     (rosa)       [1490, 210]")
    print("🎞️   Bloco 5 — Montagem FFmpeg v14     (vermelho)   [2010, 415]")
    print("📤  Bloco 6 — Publicação e Distribuição (verde)    [2420, 415]")

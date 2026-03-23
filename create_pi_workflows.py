"""
Pattern Interrupt Edit -- Create 4 new n8n workflows
Workflows: SUB PI Hook Video, SUB PI Jesus Images, PI Main
(SUB Audio + SUB Publishing are reused from existing)
"""
import json, urllib.request, urllib.error, sys
sys.stdout.reconfigure(encoding='utf-8')

N8N = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzM2QzZDk5YS00NjMyLTQyMmItOTZkZi03ZTc5M2Y5YzMwZjUiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiY2RlNzMzM2MtMTJlMS00ZmJjLWE0OTItZDJhYjVkM2U5ZGE1IiwiaWF0IjoxNzczMTkwOTA0fQ.DI0te7DG89FQOywg1jdXRGbsV8udA-NuaEK88nvIYBs"
BASE = "https://n8n-n8n.yjlhot.easypanel.host/api/v1/workflows"

GOOGLE_DRIVE_CRED = {"id": "HN60vRphPZY9kxN2", "name": "Luccapavanallo"}
GOOGLE_SHEETS_CRED = {"id": "fJucpcg9wHtiaWkG", "name": "Sheets - Luccapavanallo"}
SHEETS_DOC_ID = "12x3OJmHUBVxJAlkJ4uEzElXzbu3MH9sDs3r-yv7pETk"

# Reused workflow IDs
SUB_AUDIO_ID    = "VttkyR0BTetRiXbc"
SUB_PUBLISH_ID  = "SKUBGveT9qeXFNEW"


def create(wf):
    body = json.dumps(wf, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(BASE, data=body, method="POST")
    req.add_header("X-N8N-API-KEY", N8N)
    req.add_header("Content-Type", "application/json; charset=utf-8")
    req.add_header("Accept", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            resp = json.loads(r.read())
            return resp.get("id"), resp.get("name")
    except urllib.error.HTTPError as e:
        print("ERROR creating workflow:", e.code, e.read().decode()[:500])
        return None, None


# ===========================================================================
# WORKFLOW 1: SUB: PI - Hook Video (Veo2)
# ===========================================================================
def build_sub_hook_video():
    PI_HOOK_JS = r"""
var data = $input.first().json;
var hookPrompt = data.hook_prompt_video || 'mysterious dark figure in shadows, dramatic lighting, cinematic, vertical 9:16, no text, no words';
// Sanitize prompt - no explicit religious words that could be blocked
hookPrompt = hookPrompt.replace(/\b(jesus|christ|god|deus|bible|biblia|cross|cruz)\b/gi, '').trim();
if (!hookPrompt) hookPrompt = 'mysterious shadowy figure engulfed in dark smoke and flames, dramatic moody cinematic lighting, vertical 9:16';

return [{ json: { ...data, hookPrompt: hookPrompt } }];
""".strip()

    TRIM_JS = r"""
var childProcess = require('child_process');
var fs2 = require('fs');
var https2 = require('https');
var http2 = require('http');

var data = $input.first().json;
var videoId = data.videoId;
var tempDir = '/home/node/.n8n/temp/' + videoId;
fs2.mkdirSync(tempDir, { recursive: true });

function download(fileUrl, destPath) {
  return new Promise(function(resolve, reject) {
    var mod = fileUrl.startsWith('https:') ? https2 : http2;
    var file = fs2.createWriteStream(destPath);
    mod.get(fileUrl, { rejectUnauthorized: false }, function(res) {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        file.close(); fs2.unlinkSync(destPath);
        return download(res.headers.location, destPath).then(resolve).catch(reject);
      }
      res.pipe(file);
      file.on('finish', function() { file.close(resolve); });
      res.on('error', reject);
    }).on('error', function(err) { fs2.unlink(destPath, function(){}); reject(err); });
  });
}

// Get Veo2 video URL from response
var veoResp = $input.first().json;
var videoUri = null;
try {
  var candidates = veoResp.response && veoResp.response.videos;
  if (candidates && candidates.length > 0) videoUri = candidates[0].uri;
  if (!videoUri) {
    var metadata = veoResp.metadata || veoResp;
    if (metadata.videos && metadata.videos[0]) videoUri = metadata.videos[0].uri;
  }
} catch(e) {}

if (!videoUri) throw new Error('No video URI from Veo2. Response: ' + JSON.stringify(veoResp).substring(0, 200));

var rawHook = tempDir + '/hook_raw.mp4';
await download(videoUri, rawHook);

// Trim to exactly 4s and force 1080x1920
var hookFile = tempDir + '/hook.mp4';
childProcess.execSync(
  'ffmpeg -y -i "' + rawHook + '"' +
  ' -t 4 -c:v libx264 -preset veryfast -crf 23' +
  ' -vf scale=1080:1920:flags=lanczos -an' +
  ' "' + hookFile + '"',
  { timeout: 120000 }
);

var fileBuffer = fs2.readFileSync(hookFile);
return [{
  json: { ...data, hookLocalPath: hookFile },
  binary: {
    data: {
      data: fileBuffer.toString('base64'),
      mimeType: 'video/mp4',
      fileName: videoId + '_hook.mp4',
      fileExtension: 'mp4'
    }
  }
}];
""".strip()

    CONFIRM_JS = r"""
var data = $input.first().json;
var driveShare = $('Drive: Share Hook Publicly').first().json;
var hookVideoUrl = 'https://drive.google.com/uc?export=download&id=' + driveShare.id;
return [{
  json: {
    ...data,
    hookVideoUrl: hookVideoUrl,
    hookDriveId: driveShare.id,
    hookReady: true
  }
}];
""".strip()

    POLL_JS = r"""
var data = $input.first().json;
var opName = data._veo2OpName;
if (!opName) throw new Error('No _veo2OpName in data');

var https2 = require('https');
function httpGet(url) {
  return new Promise(function(resolve, reject) {
    https2.get(url, { rejectUnauthorized: false }, function(res) {
      var buf = '';
      res.on('data', function(d) { buf += d; });
      res.on('end', function() {
        try { resolve(JSON.parse(buf)); } catch(e) { reject(e); }
      });
    }).on('error', reject);
  });
}

var pollUrl = 'https://generativelanguage.googleapis.com/v1beta/' + opName + '?key=' + data.GOOGLE_AI_API_KEY;
var resp = await httpGet(pollUrl);
if (resp.done) {
  return [{ json: { ...resp, ...data } }];
} else {
  // Not done yet — return a signal to keep waiting
  return [{ json: { ...data, _veo2Done: false, _veo2Resp: resp } }];
}
""".strip()

    START_VEO2_BODY = """={{ JSON.stringify({
  "instances": [{ "prompt": $json.hookPrompt }],
  "parameters": {
    "aspectRatio": "9:16",
    "sampleCount": 1,
    "durationSeconds": 5
  }
}) }}"""

    nodes = [
        {
            "id": "pi-hook-trigger",
            "name": "Execute Workflow Trigger",
            "type": "n8n-nodes-base.executeWorkflowTrigger",
            "parameters": {},
            "position": [240, 400]
        },
        {
            "id": "pi-hook-build-prompt",
            "name": "Build Hook Prompt",
            "type": "n8n-nodes-base.code",
            "parameters": {"jsCode": PI_HOOK_JS},
            "position": [460, 400]
        },
        {
            "id": "pi-hook-veo2-start",
            "name": "Veo2: Start Hook Generation",
            "type": "n8n-nodes-base.httpRequest",
            "parameters": {
                "method": "POST",
                "url": "https://generativelanguage.googleapis.com/v1beta/models/veo-2.0-generate-001:predictLongRunning",
                "sendQuery": True,
                "queryParameters": {"parameters": [{"name": "key", "value": "={{ $json.GOOGLE_AI_API_KEY }}"}]},
                "sendHeaders": True,
                "headerParameters": {"parameters": [{"name": "Content-Type", "value": "application/json"}]},
                "sendBody": True,
                "specifyBody": "string",
                "body": START_VEO2_BODY,
                "options": {"timeout": 60000}
            },
            "position": [680, 400],
            "retryOnFail": True,
            "waitBetweenTries": 5000
        },
        {
            "id": "pi-hook-set-op",
            "name": "Set Op Name",
            "type": "n8n-nodes-base.set",
            "parameters": {
                "assignments": {
                    "assignments": [
                        {"id": "op1", "name": "_veo2OpName", "value": "={{ $json.name }}", "type": "string"},
                        {"id": "op2", "name": "videoId", "value": "={{ $('Execute Workflow Trigger').first().json.videoId }}", "type": "string"},
                        {"id": "op3", "name": "GOOGLE_AI_API_KEY", "value": "={{ $('Execute Workflow Trigger').first().json.GOOGLE_AI_API_KEY }}", "type": "string"}
                    ]
                },
                "options": {}
            },
            "position": [900, 400]
        },
        {
            "id": "pi-hook-wait",
            "name": "Wait 20s",
            "type": "n8n-nodes-base.wait",
            "parameters": {"resume": "timeInterval", "unit": "seconds", "value": 20},
            "position": [1120, 400]
        },
        {
            "id": "pi-hook-poll",
            "name": "Poll Veo2 Status",
            "type": "n8n-nodes-base.code",
            "parameters": {"jsCode": POLL_JS},
            "position": [1340, 400]
        },
        {
            "id": "pi-hook-check-done",
            "name": "Check Done",
            "type": "n8n-nodes-base.if",
            "parameters": {
                "conditions": {
                    "options": {"caseSensitive": True, "leftValue": "", "typeValidation": "strict"},
                    "conditions": [{
                        "id": "done-check",
                        "leftValue": "={{ $json.done }}",
                        "rightValue": True,
                        "operator": {"type": "boolean", "operation": "equals"}
                    }],
                    "combinator": "and"
                },
                "options": {}
            },
            "position": [1560, 400]
        },
        {
            "id": "pi-hook-trim",
            "name": "FFmpeg: Trim Hook",
            "type": "n8n-nodes-base.code",
            "parameters": {"jsCode": TRIM_JS},
            "position": [1780, 300]
        },
        {
            "id": "pi-hook-upload",
            "name": "Drive: Upload Hook",
            "type": "n8n-nodes-base.googleDrive",
            "typeVersion": 3,
            "parameters": {
                "name": "={{ $('Execute Workflow Trigger').first().json.videoId + '_hook.mp4' }}",
                "driveId": {"__rl": True, "mode": "list", "value": "My Drive"},
                "folderId": {"__rl": True, "mode": "list", "value": "root", "cachedResultName": "/ (Root folder)"},
                "options": {}
            },
            "credentials": {"googleDriveOAuth2Api": GOOGLE_DRIVE_CRED},
            "position": [2000, 300]
        },
        {
            "id": "pi-hook-share",
            "name": "Drive: Share Hook Publicly",
            "type": "n8n-nodes-base.googleDrive",
            "typeVersion": 3,
            "parameters": {
                "operation": "share",
                "fileId": {"__rl": True, "value": "={{ $json.id }}", "mode": "id"},
                "permissionsUi": {"permissionsValues": {"role": "reader", "type": "anyone"}},
                "options": {}
            },
            "credentials": {"googleDriveOAuth2Api": GOOGLE_DRIVE_CRED},
            "position": [2220, 300]
        },
        {
            "id": "pi-hook-confirm",
            "name": "Confirm Hook Ready",
            "type": "n8n-nodes-base.code",
            "parameters": {"jsCode": CONFIRM_JS},
            "position": [2440, 300]
        }
    ]

    connections = {
        "Execute Workflow Trigger": {"main": [[{"node": "Build Hook Prompt", "type": "main", "index": 0}]]},
        "Build Hook Prompt":        {"main": [[{"node": "Veo2: Start Hook Generation", "type": "main", "index": 0}]]},
        "Veo2: Start Hook Generation": {"main": [[{"node": "Set Op Name", "type": "main", "index": 0}]]},
        "Set Op Name":              {"main": [[{"node": "Wait 20s", "type": "main", "index": 0}]]},
        "Wait 20s":                 {"main": [[{"node": "Poll Veo2 Status", "type": "main", "index": 0}]]},
        "Poll Veo2 Status":         {"main": [[{"node": "Check Done", "type": "main", "index": 0}]]},
        "Check Done": {
            "main": [
                [{"node": "FFmpeg: Trim Hook", "type": "main", "index": 0}],
                [{"node": "Wait 20s", "type": "main", "index": 0}]
            ]
        },
        "FFmpeg: Trim Hook":        {"main": [[{"node": "Drive: Upload Hook", "type": "main", "index": 0}]]},
        "Drive: Upload Hook":       {"main": [[{"node": "Drive: Share Hook Publicly", "type": "main", "index": 0}]]},
        "Drive: Share Hook Publicly": {"main": [[{"node": "Confirm Hook Ready", "type": "main", "index": 0}]]}
    }

    return {
        "name": "SUB: PI - Hook Video (Veo2)",
        "nodes": nodes,
        "connections": connections,
        "settings": {"executionOrder": "v1"}
    }


# ===========================================================================
# WORKFLOW 2: SUB: PI - Jesus Images (Nano Banana)
# ===========================================================================
def build_sub_jesus_images():
    PREPARE_JS = r"""
var data = $input.first().json;
var prompts = data.imagens_prompts || [];
if (!prompts.length) throw new Error('No imagens_prompts in input');
// Ensure exactly 5
while (prompts.length < 5) {
  prompts.push('a compassionate healer in ancient robes with long hair and beard, bathed in warm golden divine light, looking at viewer, ancient Jerusalem background, vertical 9:16, photorealistic 8K, cinematic portrait');
}
prompts = prompts.slice(0, 5);

return prompts.map(function(prompt, idx) {
  return {
    json: {
      ...data,
      imagePrompt: prompt,
      imageIndex: idx + 1
    }
  };
});
""".strip()

    DOWNLOAD_JS = r"""
var childProcess = require('child_process');
var fs2 = require('fs');
var https2 = require('https');
var http2 = require('http');

var data = $input.first().json;
var videoId = data.videoId;
var idx = data.imageIndex;
var tempDir = '/home/node/.n8n/temp/' + videoId;
fs2.mkdirSync(tempDir, { recursive: true });

function download(fileUrl, destPath) {
  return new Promise(function(resolve, reject) {
    var mod = fileUrl.startsWith('https:') ? https2 : http2;
    var file = fs2.createWriteStream(destPath);
    mod.get(fileUrl, { rejectUnauthorized: false }, function(res) {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        file.close(); fs2.unlinkSync(destPath);
        return download(res.headers.location, destPath).then(resolve).catch(reject);
      }
      res.pipe(file);
      file.on('finish', function() { file.close(resolve); });
      res.on('error', reject);
    }).on('error', function(err) { fs2.unlink(destPath, function(){}); reject(err); });
  });
}

// Parse Nano Banana response
var nbResp = $input.first().json;
var imageUrl = null;
try {
  if (nbResp.url) imageUrl = nbResp.url;
  else if (nbResp.data && nbResp.data[0] && nbResp.data[0].url) imageUrl = nbResp.data[0].url;
  else if (nbResp.images && nbResp.images[0]) imageUrl = nbResp.images[0];
} catch(e) {}

if (!imageUrl) throw new Error('No image URL from Nano Banana. Response: ' + JSON.stringify(nbResp).substring(0, 200));

var imgFile = tempDir + '/img_' + String(idx).padStart(2, '0') + '.jpg';
await download(imageUrl, imgFile);

var fileBuffer = fs2.readFileSync(imgFile);
return [{
  json: { ...data, imageLocalPath: imgFile, imageSourceUrl: imageUrl },
  binary: {
    data: {
      data: fileBuffer.toString('base64'),
      mimeType: 'image/jpeg',
      fileName: videoId + '_img_' + String(idx).padStart(2, '0') + '.jpg',
      fileExtension: 'jpg'
    }
  }
}];
""".strip()

    AGGREGATE_JS = r"""
var allItems = $input.all();
var data = allItems[0].json;
var images = allItems.map(function(item) {
  return {
    url: 'https://drive.google.com/uc?export=download&id=' + item.json._driveId,
    driveId: item.json._driveId,
    numero: item.json.imageIndex
  };
}).sort(function(a, b) { return a.numero - b.numero; });

return [{
  json: {
    videoId: data.videoId,
    images: images,
    narracao: data.narracao,
    ctaText: data.ctaText,
    titulo: data.titulo,
    descricao: data.descricao,
    hashtags: data.hashtags,
    tema_jesus: data.tema_jesus,
    versiculo: data.versiculo,
    GOOGLE_AI_API_KEY: data.GOOGLE_AI_API_KEY,
    ELEVENLABS_API_KEY: data.ELEVENLABS_API_KEY,
    imagesReady: true
  }
}];
""".strip()

    SET_DRIVE_ID_JS = r"""
var shareData = $input.first().json;
var prev = $('Drive: Upload Image').first().json;
// Pass drive ID along with all original data
return [{
  json: {
    ...$('Download Image').first().json,
    _driveId: shareData.id
  }
}];
""".strip()

    NB_BODY = """={{ JSON.stringify({
  "model": "gemini-3-pro-image-preview",
  "prompt": $json.imagePrompt,
  "aspect_ratio": "9:16",
  "output_format": "jpeg"
}) }}"""

    nodes = [
        {
            "id": "pi-img-trigger",
            "name": "Execute Workflow Trigger",
            "type": "n8n-nodes-base.executeWorkflowTrigger",
            "parameters": {},
            "position": [240, 400]
        },
        {
            "id": "pi-img-prepare",
            "name": "Prepare Image Prompts",
            "type": "n8n-nodes-base.code",
            "parameters": {"jsCode": PREPARE_JS},
            "position": [460, 400]
        },
        {
            "id": "pi-img-batch",
            "name": "Process Each Image",
            "type": "n8n-nodes-base.splitInBatches",
            "parameters": {"batchSize": 1, "options": {}},
            "position": [680, 400]
        },
        {
            "id": "pi-img-generate",
            "name": "Nano Banana: Generate Image",
            "type": "n8n-nodes-base.httpRequest",
            "parameters": {
                "method": "POST",
                "url": "https://api.nanabanana.ai/v1/images/generate",
                "sendHeaders": True,
                "headerParameters": {"parameters": [
                    {"name": "Authorization", "value": "={{ 'Bearer ' + $json.GOOGLE_AI_API_KEY }}"},
                    {"name": "Content-Type", "value": "application/json"}
                ]},
                "sendBody": True,
                "specifyBody": "string",
                "body": NB_BODY,
                "options": {"timeout": 120000}
            },
            "position": [900, 400],
            "retryOnFail": True,
            "waitBetweenTries": 5000,
            "maxTries": 3
        },
        {
            "id": "pi-img-download",
            "name": "Download Image",
            "type": "n8n-nodes-base.code",
            "parameters": {"jsCode": DOWNLOAD_JS},
            "position": [1120, 400]
        },
        {
            "id": "pi-img-upload",
            "name": "Drive: Upload Image",
            "type": "n8n-nodes-base.googleDrive",
            "typeVersion": 3,
            "parameters": {
                "name": "={{ $json.videoId + '_img_' + String($json.imageIndex).padStart(2, '0') + '.jpg' }}",
                "driveId": {"__rl": True, "mode": "list", "value": "My Drive"},
                "folderId": {"__rl": True, "mode": "list", "value": "root", "cachedResultName": "/ (Root folder)"},
                "options": {}
            },
            "credentials": {"googleDriveOAuth2Api": GOOGLE_DRIVE_CRED},
            "position": [1340, 400]
        },
        {
            "id": "pi-img-share",
            "name": "Drive: Share Image Publicly",
            "type": "n8n-nodes-base.googleDrive",
            "typeVersion": 3,
            "parameters": {
                "operation": "share",
                "fileId": {"__rl": True, "value": "={{ $json.id }}", "mode": "id"},
                "permissionsUi": {"permissionsValues": {"role": "reader", "type": "anyone"}},
                "options": {}
            },
            "credentials": {"googleDriveOAuth2Api": GOOGLE_DRIVE_CRED},
            "position": [1560, 400]
        },
        {
            "id": "pi-img-set-id",
            "name": "Set Drive ID",
            "type": "n8n-nodes-base.code",
            "parameters": {"jsCode": SET_DRIVE_ID_JS},
            "position": [1780, 400]
        },
        {
            "id": "pi-img-loop-back",
            "name": "Check All Done",
            "type": "n8n-nodes-base.if",
            "parameters": {
                "conditions": {
                    "options": {"caseSensitive": True, "leftValue": "", "typeValidation": "strict"},
                    "conditions": [{
                        "id": "batch-done",
                        "leftValue": "={{ $('Process Each Image').context.noItemsLeft }}",
                        "rightValue": True,
                        "operator": {"type": "boolean", "operation": "equals"}
                    }],
                    "combinator": "and"
                },
                "options": {}
            },
            "position": [2000, 400]
        },
        {
            "id": "pi-img-aggregate",
            "name": "Aggregate Images",
            "type": "n8n-nodes-base.code",
            "parameters": {"jsCode": AGGREGATE_JS},
            "position": [2220, 300]
        }
    ]

    connections = {
        "Execute Workflow Trigger": {"main": [[{"node": "Prepare Image Prompts", "type": "main", "index": 0}]]},
        "Prepare Image Prompts":    {"main": [[{"node": "Process Each Image", "type": "main", "index": 0}]]},
        "Process Each Image":       {"main": [[{"node": "Nano Banana: Generate Image", "type": "main", "index": 0}]]},
        "Nano Banana: Generate Image": {"main": [[{"node": "Download Image", "type": "main", "index": 0}]]},
        "Download Image":           {"main": [[{"node": "Drive: Upload Image", "type": "main", "index": 0}]]},
        "Drive: Upload Image":      {"main": [[{"node": "Drive: Share Image Publicly", "type": "main", "index": 0}]]},
        "Drive: Share Image Publicly": {"main": [[{"node": "Set Drive ID", "type": "main", "index": 0}]]},
        "Set Drive ID":             {"main": [[{"node": "Check All Done", "type": "main", "index": 0}]]},
        "Check All Done": {
            "main": [
                [{"node": "Aggregate Images", "type": "main", "index": 0}],
                [{"node": "Process Each Image", "type": "main", "index": 0}]
            ]
        }
    }

    return {
        "name": "SUB: PI - Jesus Images (Nano Banana)",
        "nodes": nodes,
        "connections": connections,
        "settings": {"executionOrder": "v1"}
    }


# ===========================================================================
# WORKFLOW 3: PI Main
# ===========================================================================
def build_pi_main(sub_hook_id, sub_images_id):
    GEMINI_CONCEPT_BODY = r"""={{ JSON.stringify({
  "contents": [{
    "parts": [{
      "text": "Voce e um especialista em conteudo cristaO viral. Crie um conceito completo para um video de edit no estilo 'pattern interrupt'. Responda APENAS com um JSON valido, sem texto antes ou depois.\n\nESTRUTURA DO VIDEO:\n- 4s: Hook dark/misterioso (cena Veo2 - nao mostrar Jesus ainda)\n- 15s: Edit de Jesus com 5 imagens animadas (Ken Burns)\n- Ultimos 4s: CTA em texto amarelo\n\nRETORNE EXATAMENTE ESTE JSON:\n{\n  \"tema_jesus\": \"string - o milagre ou ensinamento\",\n  \"versiculo\": \"string - versículo bíblico completo\",\n  \"hook_prompt_video\": \"string EN - prompt para Veo2, cena dark/misteriosa SEM nomes religiosos, ex: mysterious shadowy figure...\",\n  \"imagens_prompts\": [\n    \"string EN - imagem 1, close no rosto, expressao compassiva\",\n    \"string EN - imagem 2, bracos abertos, luz dourada atrás\",\n    \"string EN - imagem 3, tocando pessoa prostrada, expressao de amor\",\n    \"string EN - imagem 4, olhando ao ceu, gloria e luz\",\n    \"string EN - imagem 5, apontando para o espectador, determinado\"\n  ],\n  \"narracao\": \"string PT-BR - 50 a 70 palavras, ritmo de pregacao evangelica, incluindo: guilt-trip (voce esta passando por algo), revelacao do milagre, instrucao de engajamento, oracao curta de fechamento\",\n  \"ctaText\": \"string PT-BR - 1 frase curta de CTA (ex: Me siga para nao perder sua bencao)\",\n  \"titulo\": \"string PT-BR - titulo com emoji, max 60 chars, urgencia\",\n  \"descricao\": \"string PT-BR - descricao do video, 2 a 3 frases\",\n  \"hashtags\": [\"array\", \"de\", \"hashtags\", \"PT-BR\"]\n}\n\nREGRAS:\n- hook_prompt_video: apenas em ingles, NUNCA use Jesus/God/Christ explicitamente (pode ser bloqueado)\n- imagens_prompts: personagem CONSISTENTE em todas as 5 imagens - homem com vestes antigas, barba, cabelos longos, luz divina\n- narracao: ritmo evangelico brasileiro autentico, culpa + esperanca + acao\n- Temas ja usados para evitar: " + ($json.temasUsadosStr || "nenhum")
    }]
  }],
  "generationConfig": {
    "temperature": 0.85,
    "maxOutputTokens": 8192,
    "responseMimeType": "application/json"
  }
}) }}"""

    PARSE_CONCEPT_JS = r"""
var resp = $input.first().json;
var raw = null;
try {
  raw = resp.candidates[0].content.parts[0].text.trim();
} catch(e) { throw new Error('Gemini response malformed: ' + JSON.stringify(resp).substring(0, 200)); }

var concept = null;
// Remove possible markdown code fences
raw = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
try { concept = JSON.parse(raw); } catch(e) { throw new Error('Invalid JSON from Gemini: ' + raw.substring(0, 300)); }

var prev = $('Agregar Temas PI').first().json;
var videoId = 'PI_' + new Date().toISOString().replace(/[-T:.Z]/g, '').substring(0, 14);

return [{
  json: {
    videoId: videoId,
    tema_jesus: concept.tema_jesus || '',
    versiculo: concept.versiculo || '',
    hook_prompt_video: concept.hook_prompt_video || '',
    imagens_prompts: concept.imagens_prompts || [],
    narracao: concept.narracao || '',
    ctaText: concept.ctaText || 'Me siga para nao perder sua bencao',
    titulo: concept.titulo || '',
    descricao: concept.descricao || '',
    hashtags: concept.hashtags || [],
    GOOGLE_AI_API_KEY: prev.GOOGLE_AI_API_KEY,
    ELEVENLABS_API_KEY: prev.ELEVENLABS_API_KEY,
    status: 'concept_ready'
  }
}];
""".strip()

    AGREGAR_TEMAS_JS = r"""
var allItems = $input.all();
var first = allItems[0].json;
var temasArr = allItems.map(function(i) { return i.json['Tema'] || i.json['tema'] || ''; }).filter(Boolean);
var temasStr = temasArr.length ? 'Temas ja usados (evite): ' + temasArr.join(', ') : '';
return [{
  json: {
    temasUsadosStr: temasStr,
    GOOGLE_AI_API_KEY: first.GOOGLE_AI_API_KEY,
    ELEVENLABS_API_KEY: first.ELEVENLABS_API_KEY,
    VIDEOS_PER_RUN: first.VIDEOS_PER_RUN || '1'
  }
}];
""".strip()

    FORMAT_OUTPUT_JS = r"""
var allItems = $input.all();
var hookData   = allItems.find(function(i) { return i.json.hookReady; }) || {};
var imageData  = allItems.find(function(i) { return i.json.imagesReady; }) || {};
var audioData  = allItems.find(function(i) { return i.json.audioUrl; }) || {};

var videoId = imageData.json && imageData.json.videoId || hookData.json && hookData.json.videoId || 'PI_unknown';
var titulo  = imageData.json && imageData.json.titulo  || '';

return [{
  json: {
    videoId: videoId,
    titulo: titulo,
    descricao: imageData.json && imageData.json.descricao || '',
    hashtags:  imageData.json && imageData.json.hashtags  || [],
    narracao:  imageData.json && imageData.json.narracao  || audioData.json && audioData.json.narracao || '',
    ctaText:   imageData.json && imageData.json.ctaText   || '',
    hookVideoUrl:  hookData.json  && hookData.json.hookVideoUrl  || '',
    images:        imageData.json && imageData.json.images        || [],
    audioUrl:      audioData.json && audioData.json.audioUrl      || '',
    GOOGLE_AI_API_KEY: imageData.json && imageData.json.GOOGLE_AI_API_KEY || ''
  }
}];
""".strip()

    FFMPEG_PI_JS = r"""
var childProcess = require('child_process');
var fs2 = require('fs');
var https2 = require('https');
var http2 = require('http');

var allItems = $input.all().map(function(i) { return i.json; });
var hookData  = allItems.find(function(d) { return d.hookVideoUrl; }) || {};
var imageData = allItems.find(function(d) { return d.images && d.images.length > 0; }) || {};
var audioData = allItems.find(function(d) { return d.audioUrl; }) || {};

var videoId   = imageData.videoId || hookData.videoId || audioData.videoId;
var hookUrl   = hookData.hookVideoUrl;
var images    = (imageData.images || []).sort(function(a, b) { return (a.numero || 0) - (b.numero || 0); });
var audioUrl  = audioData.audioUrl;
var narracao  = audioData.narracao || imageData.narracao || '';
var ctaText   = imageData.ctaText || hookData.ctaText || '';
var titulo    = imageData.titulo || '';

if (!hookUrl)  throw new Error('No hookVideoUrl');
if (!images.length) throw new Error('No images');
if (!audioUrl) throw new Error('No audioUrl');

var tempDir = '/home/node/.n8n/temp/' + videoId;
fs2.mkdirSync(tempDir, { recursive: true });

function download(fileUrl, destPath) {
  return new Promise(function(resolve, reject) {
    var mod = fileUrl.startsWith('https:') ? https2 : http2;
    var file = fs2.createWriteStream(destPath);
    mod.get(fileUrl, { rejectUnauthorized: false }, function(res) {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        file.close(); fs2.unlinkSync(destPath);
        return download(res.headers.location, destPath).then(resolve).catch(reject);
      }
      res.pipe(file);
      file.on('finish', function() { file.close(resolve); });
      res.on('error', reject);
    }).on('error', function(err) { fs2.unlink(destPath, function(){}); reject(err); });
  });
}

// ── Download all assets ───────────────────────────────────────────────────
var fontPath = '/home/node/.n8n/temp/Roboto-Bold.ttf';
if (!fs2.existsSync(fontPath)) {
  await download('https://github.com/google/fonts/raw/main/apache/roboto/static/Roboto-Bold.ttf', fontPath);
}

var hookFile  = tempDir + '/hook.mp4';
var audioFile = tempDir + '/narration.mp3';
var MUSIC_TRACKS = [
  'https://cdn.pixabay.com/audio/2024/02/27/audio_6d33c54bfa.mp3',
  'https://cdn.pixabay.com/audio/2022/10/30/audio_0b4c6ed258.mp3'
];
var musicFile = tempDir + '/music.mp3';

await download(hookUrl,  hookFile);
await download(audioUrl, audioFile);
await download(MUSIC_TRACKS[Math.floor(Math.random() * MUSIC_TRACKS.length)], musicFile);

// ── Download images ───────────────────────────────────────────────────────
var imgFiles = [];
for (var i = 0; i < images.length; i++) {
  var imgFile = tempDir + '/img_' + String(i + 1).padStart(2, '0') + '.jpg';
  await download(images[i].url, imgFile);
  imgFiles.push(imgFile);
}

// ── Measure audio duration ────────────────────────────────────────────────
var audioDuration = parseFloat(childProcess.execSync(
  'ffprobe -v quiet -show_entries format=duration -of csv=p=0 "' + audioFile + '"'
).toString().trim()) || 30;

// ── Step 1: Ken Burns clips (3s each from static images) ─────────────────
var kenBurnsClips = [];
for (var ki = 0; ki < imgFiles.length; ki++) {
  var kbFile = tempDir + '/kb_' + String(ki + 1).padStart(2, '0') + '.mp4';
  // Alternate zoom direction for variety
  var zoomExpr = ki % 2 === 0
    ? "min(zoom+0.0015,1.4)"
    : "if(lte(zoom,1.0),1.4,max(1.0,zoom-0.0015))";
  childProcess.execSync(
    'ffmpeg -y -loop 1 -i "' + imgFiles[ki] + '"' +
    ' -vf "scale=2160:3840,zoompan=z=\'' + zoomExpr + '\':x=\'iw/2-(iw/zoom/2)\':y=\'ih/2-(ih/zoom/2)\':d=75:fps=25:s=1080x1920,format=yuv420p"' +
    ' -t 3 -c:v libx264 -preset veryfast -r 25 "' + kbFile + '"',
    { timeout: 120000 }
  );
  kenBurnsClips.push(kbFile);
}

// ── Step 2: Crossfade between KB clips ───────────────────────────────────
// Each clip is 3s, crossfade 0.4s overlap
// xfade: offset = cumulative_duration - overlap
var FADE = 0.4;
var CLIP_DUR = 3.0;

// Build xfade filter chain
if (kenBurnsClips.length === 1) {
  // No xfade needed
  var editConcat = kenBurnsClips[0];
  var editDuration = CLIP_DUR;
} else {
  var inputs = kenBurnsClips.map(function(f, idx) { return '-i "' + f + '"'; }).join(' ');
  var filterParts = [];
  var currentOffset = 0;
  var prevLabel = '[0:v]';
  for (var fi = 1; fi < kenBurnsClips.length; fi++) {
    currentOffset = fi * CLIP_DUR - fi * FADE;
    var outLabel = fi === kenBurnsClips.length - 1 ? '[edit]' : '[xf' + fi + ']';
    filterParts.push(prevLabel + '[' + fi + ':v]xfade=transition=fade:duration=' + FADE + ':offset=' + currentOffset.toFixed(2) + outLabel);
    prevLabel = outLabel;
  }
  var editConcat = tempDir + '/edit.mp4';
  var editDuration = kenBurnsClips.length * CLIP_DUR - (kenBurnsClips.length - 1) * FADE;
  childProcess.execSync(
    'ffmpeg -y ' + inputs +
    ' -filter_complex "' + filterParts.join(';') + '"' +
    ' -map "[edit]" -c:v libx264 -preset veryfast -crf 23 -r 25' +
    ' "' + editConcat + '"',
    { timeout: 300000 }
  );
}

// ── Step 3: Concat hook + edit ────────────────────────────────────────────
var concatList = tempDir + '/concat_pi.txt';
fs2.writeFileSync(concatList,
  "file '" + hookFile + "'\n" +
  "file '" + editConcat + "'"
);
var fullVideo = tempDir + '/full.mp4';
childProcess.execSync(
  'ffmpeg -y -f concat -safe 0 -i "' + concatList + '"' +
  ' -c:v libx264 -preset veryfast -crf 23 -vf scale=1080:1920:flags=lanczos -an' +
  ' "' + fullVideo + '"',
  { timeout: 300000 }
);

// ── Step 4: Text overlays ─────────────────────────────────────────────────
function escapeDrawtext(str) {
  return (str || '')
    .replace(/\\/g,  '')
    .replace(/'/g,   '\u2019')
    .replace(/:/g,   ' -')
    .replace(/[\[\]%]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function splitIntoGroups(text) {
  if (!text) return [];
  var parts = text.trim().split(/([.!?]+)/);
  var sentences = [];
  for (var si = 0; si < parts.length; si += 2) {
    var body = (parts[si] || '').trim();
    var punct = (parts[si + 1] || '').trim();
    var s = (body + punct).trim();
    if (s) sentences.push(s);
  }
  if (!sentences.length) sentences = [text.trim()];
  var groups = [];
  sentences.forEach(function(sentence) {
    sentence = sentence.trim();
    if (!sentence) return;
    var words = sentence.split(/\s+/);
    if (words.length <= 5) { groups.push(sentence); }
    else {
      for (var gi = 0; gi < words.length; gi += 5) {
        var chunk = words.slice(gi, gi + 5).join(' ');
        if (chunk) groups.push(chunk);
      }
    }
  });
  return groups.length ? groups : [text.trim()];
}

// Subtitles: run from t=4 (after hook) until t=4+editDuration-4 (before CTA)
var HOOK_DUR = 4;
var CTA_DUR  = 4;
var subStart = HOOK_DUR;
var subEnd   = HOOK_DUR + editDuration - CTA_DUR;
var narGroups = splitIntoGroups(narracao);
var perGroup = (subEnd - subStart) / (narGroups.length || 1);

var vfFilters = [];

// Subtitle filters
narGroups.forEach(function(group, idx) {
  var t0 = (subStart + idx * perGroup).toFixed(2);
  var t1 = Math.min(subStart + (idx + 1) * perGroup, subEnd).toFixed(2);
  vfFilters.push(
    'drawtext=fontfile=' + fontPath +
    ':text=\'' + escapeDrawtext(group) + '\'' +
    ':fontsize=54:fontcolor=white' +
    ':bordercolor=black@1.0:borderw=5' +
    ':x=(w-text_w)/2:y=h-200' +
    ':enable=\'between(t,' + t0 + ',' + t1 + ')\''
  );
});

// CTA: yellow text in last 4s, top area (h*0.15) to avoid conflict with subtitles
var ctaStartTime = (HOOK_DUR + editDuration - CTA_DUR).toFixed(2);
var ctaCleaned = (ctaText || 'Me siga para nao perder sua bencao').trim();
var ctaWords = ctaCleaned.split(/\s+/);
var mid = Math.ceil(ctaWords.length / 2);
var cta1 = escapeDrawtext(ctaWords.slice(0, mid).join(' '));
var cta2 = escapeDrawtext(ctaWords.slice(mid).join(' '));
var ctaEn = 'gte(t,' + ctaStartTime + ')';
if (cta1) vfFilters.push(
  'drawtext=fontfile=' + fontPath +
  ':text=\'' + cta1 + '\'' +
  ':fontsize=62:fontcolor=#FFD700' +
  ':bordercolor=black@1.0:borderw=6' +
  ':box=1:boxcolor=black@0.70:boxborderw=18' +
  ':x=(w-text_w)/2:y=(h*15)/100' +
  ':enable=\'' + ctaEn + '\''
);
if (cta2) vfFilters.push(
  'drawtext=fontfile=' + fontPath +
  ':text=\'' + cta2 + '\'' +
  ':fontsize=62:fontcolor=#FFD700' +
  ':bordercolor=black@1.0:borderw=6' +
  ':box=1:boxcolor=black@0.70:boxborderw=18' +
  ':x=(w-text_w)/2:y=(h*15)/100+80' +
  ':enable=\'' + ctaEn + '\''
);

var vfChain = vfFilters.length > 0 ? vfFilters.join(',') : 'null';
var filterComplex =
  '[0:v]' + vfChain + '[v];' +
  '[1:a]volume=1.0[narr];' +
  '[2:a]volume=0.18[mus];' +
  '[narr][mus]amix=inputs=2:duration=first[aout]';

var finalVideo = tempDir + '/final_pi.mp4';
childProcess.execSync(
  'ffmpeg -y' +
  ' -i "' + fullVideo + '"' +
  ' -i "' + audioFile + '"' +
  ' -stream_loop -1 -i "' + musicFile + '"' +
  ' -filter_complex "' + filterComplex + '"' +
  ' -map "[v]" -map "[aout]"' +
  ' -c:v libx264 -preset veryfast -crf 25' +
  ' -c:a aac -b:a 128k -shortest' +
  ' "' + finalVideo + '"',
  { timeout: 300000 }
);

var fileBuffer = fs2.readFileSync(finalVideo);

return [{
  json: {
    videoId: videoId,
    localPath: finalVideo,
    titulo: titulo,
    descricao: imageData.descricao || '',
    hashtags:  imageData.hashtags  || [],
    narracao:  narracao,
    fileName:  videoId + '_pi.mp4'
  },
  binary: {
    data: {
      data: fileBuffer.toString('base64'),
      mimeType: 'video/mp4',
      fileName: videoId + '_pi.mp4',
      fileExtension: 'mp4'
    }
  }
}];
""".strip()

    PARSE_PI_OUTPUT_JS = r"""
var data = $input.first().json;
var driveData = $('Drive: Share PI Video Publicly').first().json;
var fileUrl = 'https://drive.google.com/uc?export=download&id=' + driveData.id;

return [{
  json: {
    videoId: data.videoId,
    renderUrl: fileUrl,
    driveId: driveData.id,
    titulo: data.titulo,
    descricao: data.descricao,
    hashtags: data.hashtags,
    narracao: data.narracao,
    status: 'pi_ready'
  }
}];
""".strip()

    SAVE_TEMA_JS = r"""
var data = $input.first().json;
return [{ json: { tema: data.tema_jesus, Tema: data.tema_jesus } }];
""".strip()

    nodes = [
        # ── Triggers ──
        {
            "id": "pi-main-schedule",
            "name": "Schedule Trigger",
            "type": "n8n-nodes-base.scheduleTrigger",
            "parameters": {
                "rule": {"interval": [{"field": "hours", "hoursInterval": 8}]}
            },
            "position": [240, 320]
        },
        {
            "id": "pi-main-webhook",
            "name": "Webhook Trigger (Manual)",
            "type": "n8n-nodes-base.webhook",
            "parameters": {
                "path": "pi-generate",
                "responseMode": "lastNode",
                "options": {}
            },
            "position": [240, 520]
        },
        # ── Config ──
        {
            "id": "pi-main-set-config",
            "name": "Set Config PI",
            "type": "n8n-nodes-base.set",
            "parameters": {
                "assignments": {
                    "assignments": [
                        {"id": "pi-cfg-elevenlabs", "name": "ELEVENLABS_API_KEY", "value": "7725c641b57d3177577c93291aeffe8dc63b5103ee1ab46afde0bb6f7e7e262d", "type": "string"},
                        {"id": "pi-cfg-google", "name": "GOOGLE_AI_API_KEY", "value": "AIzaSyBMsKSA1FzrpGE78nSngCHd3zh-Ok5I56c", "type": "string"},
                        {"id": "pi-cfg-videos", "name": "VIDEOS_PER_RUN", "value": "1", "type": "string"}
                    ]
                },
                "options": {}
            },
            "position": [460, 400]
        },
        # ── Sheets ──
        {
            "id": "pi-main-sheets-read",
            "name": "Sheets: Ler Temas PI",
            "type": "n8n-nodes-base.googleSheets",
            "typeVersion": 4.5,
            "parameters": {
                "documentId": {
                    "__rl": True,
                    "value": SHEETS_DOC_ID,
                    "mode": "list",
                    "cachedResultName": "TEMAS VIDEOS RELIGIOSOS",
                    "cachedResultUrl": "https://docs.google.com/spreadsheets/d/" + SHEETS_DOC_ID + "/edit?usp=drivesdk"
                },
                "sheetName": {
                    "__rl": True,
                    "value": "gid=0",
                    "mode": "list",
                    "cachedResultName": "Temas",
                    "cachedResultUrl": "https://docs.google.com/spreadsheets/d/" + SHEETS_DOC_ID + "/edit#gid=0"
                },
                "options": {}
            },
            "credentials": {"googleSheetsOAuth2Api": GOOGLE_SHEETS_CRED},
            "position": [680, 400]
        },
        {
            "id": "pi-main-agregar",
            "name": "Agregar Temas PI",
            "type": "n8n-nodes-base.code",
            "parameters": {"jsCode": AGREGAR_TEMAS_JS},
            "position": [900, 400]
        },
        # ── Gemini concept ──
        {
            "id": "pi-main-gemini",
            "name": "Generate Edit Concept (Gemini)",
            "type": "n8n-nodes-base.httpRequest",
            "parameters": {
                "method": "POST",
                "url": "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
                "sendQuery": True,
                "queryParameters": {"parameters": [{"name": "key", "value": "={{ $json.GOOGLE_AI_API_KEY }}"}]},
                "sendHeaders": True,
                "headerParameters": {"parameters": [{"name": "Content-Type", "value": "application/json"}]},
                "sendBody": True,
                "specifyBody": "string",
                "body": GEMINI_CONCEPT_BODY,
                "options": {"timeout": 60000}
            },
            "position": [1120, 400],
            "retryOnFail": True,
            "waitBetweenTries": 5000
        },
        {
            "id": "pi-main-parse-concept",
            "name": "Parse Concept",
            "type": "n8n-nodes-base.code",
            "parameters": {"jsCode": PARSE_CONCEPT_JS},
            "position": [1340, 400]
        },
        # ── Save tema ──
        {
            "id": "pi-main-save-tema-prep",
            "name": "Prep Tema PI",
            "type": "n8n-nodes-base.code",
            "parameters": {"jsCode": SAVE_TEMA_JS},
            "position": [1560, 240]
        },
        {
            "id": "pi-main-sheets-save",
            "name": "Sheets: Salvar Temas PI",
            "type": "n8n-nodes-base.googleSheets",
            "typeVersion": 4.5,
            "parameters": {
                "operation": "append",
                "documentId": {
                    "__rl": True,
                    "value": SHEETS_DOC_ID,
                    "mode": "list",
                    "cachedResultName": "TEMAS VIDEOS RELIGIOSOS"
                },
                "sheetName": {
                    "__rl": True,
                    "value": "gid=0",
                    "mode": "list",
                    "cachedResultName": "Temas"
                },
                "columns": {
                    "mappingMode": "defineBelow",
                    "value": {"Tema": "={{ $json.Tema }}"},
                    "matchingColumns": ["Tema"],
                    "schema": [{"id": "Tema", "displayName": "Tema", "required": False, "defaultMatch": False, "display": True, "type": "string", "canBeUsedToMatch": True}],
                    "attemptToConvertTypes": False,
                    "convertFieldsToString": False
                },
                "options": {}
            },
            "credentials": {"googleSheetsOAuth2Api": GOOGLE_SHEETS_CRED},
            "position": [1780, 240]
        },
        # ── 3 parallel sub-workflows ──
        {
            "id": "pi-main-sub-hook",
            "name": "SUB: PI Hook Video",
            "type": "n8n-nodes-base.executeWorkflow",
            "typeVersion": 1.3,
            "parameters": {
                "workflowId": {
                    "__rl": True,
                    "value": sub_hook_id,
                    "mode": "list",
                    "cachedResultName": "SUB: PI - Hook Video (Veo2)"
                },
                "workflowInputs": {"mappingMode": "defineBelow", "value": {}, "matchingColumns": [], "schema": [], "attemptToConvertTypes": False, "convertFieldsToString": True},
                "options": {}
            },
            "position": [1560, 400]
        },
        {
            "id": "pi-main-sub-images",
            "name": "SUB: PI Jesus Images",
            "type": "n8n-nodes-base.executeWorkflow",
            "typeVersion": 1.3,
            "parameters": {
                "workflowId": {
                    "__rl": True,
                    "value": sub_images_id,
                    "mode": "list",
                    "cachedResultName": "SUB: PI - Jesus Images (Nano Banana)"
                },
                "workflowInputs": {"mappingMode": "defineBelow", "value": {}, "matchingColumns": [], "schema": [], "attemptToConvertTypes": False, "convertFieldsToString": True},
                "options": {}
            },
            "position": [1560, 560]
        },
        {
            "id": "pi-main-sub-audio",
            "name": "SUB: Audio Generation",
            "type": "n8n-nodes-base.executeWorkflow",
            "typeVersion": 1.3,
            "parameters": {
                "workflowId": {
                    "__rl": True,
                    "value": SUB_AUDIO_ID,
                    "mode": "list",
                    "cachedResultName": "SUB: Audio Generation (ElevenLabs)"
                },
                "workflowInputs": {"mappingMode": "defineBelow", "value": {}, "matchingColumns": [], "schema": [], "attemptToConvertTypes": False, "convertFieldsToString": True},
                "options": {}
            },
            "position": [1560, 720]
        },
        # ── Merge ──
        {
            "id": "pi-main-merge",
            "name": "Merge",
            "type": "n8n-nodes-base.merge",
            "typeVersion": 3.2,
            "parameters": {},
            "position": [1900, 560],
            "retryOnFail": True,
            "waitBetweenTries": 5000
        },
        # ── Format output for FFmpeg ──
        {
            "id": "pi-main-format",
            "name": "Format PI Inputs",
            "type": "n8n-nodes-base.code",
            "parameters": {"jsCode": FORMAT_OUTPUT_JS},
            "position": [2120, 560]
        },
        # ── FFmpeg PI Assembly ──
        {
            "id": "pi-main-ffmpeg",
            "name": "FFmpeg: PI Assembly",
            "type": "n8n-nodes-base.code",
            "parameters": {"jsCode": FFMPEG_PI_JS},
            "position": [2340, 560]
        },
        # ── Drive upload ──
        {
            "id": "pi-main-drive-upload",
            "name": "Drive: Upload PI Video",
            "type": "n8n-nodes-base.googleDrive",
            "typeVersion": 3,
            "parameters": {
                "name": "={{ $json.fileName }}",
                "driveId": {"__rl": True, "mode": "list", "value": "My Drive"},
                "folderId": {"__rl": True, "mode": "list", "value": "root", "cachedResultName": "/ (Root folder)"},
                "options": {}
            },
            "credentials": {"googleDriveOAuth2Api": GOOGLE_DRIVE_CRED},
            "position": [2560, 560]
        },
        {
            "id": "pi-main-drive-share",
            "name": "Drive: Share PI Video Publicly",
            "type": "n8n-nodes-base.googleDrive",
            "typeVersion": 3,
            "parameters": {
                "operation": "share",
                "fileId": {"__rl": True, "value": "={{ $json.id }}", "mode": "id"},
                "permissionsUi": {"permissionsValues": {"role": "reader", "type": "anyone"}},
                "options": {}
            },
            "credentials": {"googleDriveOAuth2Api": GOOGLE_DRIVE_CRED},
            "position": [2780, 560]
        },
        # ── Parse output ──
        {
            "id": "pi-main-parse-output",
            "name": "Parse PI Output",
            "type": "n8n-nodes-base.code",
            "parameters": {"jsCode": PARSE_PI_OUTPUT_JS},
            "position": [3000, 560]
        },
        # ── SUB Publish ──
        {
            "id": "pi-main-publish",
            "name": "SUB: Publicacao",
            "type": "n8n-nodes-base.executeWorkflow",
            "typeVersion": 1.3,
            "parameters": {
                "workflowId": {
                    "__rl": True,
                    "value": SUB_PUBLISH_ID,
                    "mode": "list",
                    "cachedResultName": "SUB: Publishing (YouTube + Instagram + TikTok)"
                },
                "workflowInputs": {"mappingMode": "defineBelow", "value": {}, "matchingColumns": [], "schema": [], "attemptToConvertTypes": False, "convertFieldsToString": True},
                "options": {}
            },
            "position": [3220, 560]
        }
    ]

    connections = {
        "Schedule Trigger":             {"main": [[{"node": "Set Config PI", "type": "main", "index": 0}]]},
        "Webhook Trigger (Manual)":     {"main": [[{"node": "Set Config PI", "type": "main", "index": 0}]]},
        "Set Config PI":                {"main": [[{"node": "Sheets: Ler Temas PI", "type": "main", "index": 0}]]},
        "Sheets: Ler Temas PI":         {"main": [[{"node": "Agregar Temas PI", "type": "main", "index": 0}]]},
        "Agregar Temas PI":             {"main": [[{"node": "Generate Edit Concept (Gemini)", "type": "main", "index": 0}]]},
        "Generate Edit Concept (Gemini)": {"main": [[{"node": "Parse Concept", "type": "main", "index": 0}]]},
        "Parse Concept": {"main": [[
            {"node": "Prep Tema PI", "type": "main", "index": 0},
            {"node": "SUB: PI Hook Video", "type": "main", "index": 0},
            {"node": "SUB: PI Jesus Images", "type": "main", "index": 0},
            {"node": "SUB: Audio Generation", "type": "main", "index": 0}
        ]]},
        "Prep Tema PI":                 {"main": [[{"node": "Sheets: Salvar Temas PI", "type": "main", "index": 0}]]},
        "SUB: PI Hook Video":           {"main": [[{"node": "Merge", "type": "main", "index": 0}]]},
        "SUB: PI Jesus Images":         {"main": [[{"node": "Merge", "type": "main", "index": 1}]]},
        "SUB: Audio Generation":        {"main": [[{"node": "Merge", "type": "main", "index": 2}]]},
        "Merge":                        {"main": [[{"node": "Format PI Inputs", "type": "main", "index": 0}]]},
        "Format PI Inputs":             {"main": [[{"node": "FFmpeg: PI Assembly", "type": "main", "index": 0}]]},
        "FFmpeg: PI Assembly":          {"main": [[{"node": "Drive: Upload PI Video", "type": "main", "index": 0}]]},
        "Drive: Upload PI Video":       {"main": [[{"node": "Drive: Share PI Video Publicly", "type": "main", "index": 0}]]},
        "Drive: Share PI Video Publicly": {"main": [[{"node": "Parse PI Output", "type": "main", "index": 0}]]},
        "Parse PI Output":              {"main": [[{"node": "SUB: Publicacao", "type": "main", "index": 0}]]}
    }

    return {
        "name": "PI: Pattern Interrupt Edit (Main)",
        "nodes": nodes,
        "connections": connections,
        "settings": {"executionOrder": "v1"}
    }


# ===========================================================================
# MAIN EXECUTION
# ===========================================================================
print("Creating SUB: PI - Hook Video (Veo2)...")
hook_id, hook_name = create(build_sub_hook_video())
if not hook_id:
    print("FAILED to create hook workflow. Aborting.")
    sys.exit(1)
print("  Created:", hook_id, hook_name)

print("Creating SUB: PI - Jesus Images (Nano Banana)...")
images_id, images_name = create(build_sub_jesus_images())
if not images_id:
    print("FAILED to create images workflow. Aborting.")
    sys.exit(1)
print("  Created:", images_id, images_name)

print("Creating PI: Pattern Interrupt Edit (Main)...")
main_id, main_name = create(build_pi_main(hook_id, images_id))
if not main_id:
    print("FAILED to create main workflow. Aborting.")
    sys.exit(1)
print("  Created:", main_id, main_name)

print()
print("=== ALL WORKFLOWS CREATED ===")
print("SUB Hook Video:   https://n8n-n8n.yjlhot.easypanel.host/workflow/" + hook_id)
print("SUB Jesus Images: https://n8n-n8n.yjlhot.easypanel.host/workflow/" + images_id)
print("PI Main:          https://n8n-n8n.yjlhot.easypanel.host/workflow/" + main_id)
print()
print("To test: POST https://n8n-n8n.yjlhot.easypanel.host/webhook/pi-generate")

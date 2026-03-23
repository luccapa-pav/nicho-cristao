# Setup Guide — Nicho Cristão Video Automation

## Pré-requisitos

- Docker Desktop instalado
- Chaves de API: Claude (Anthropic), ElevenLabs, Nano Banana (ou Replicate)
- FFmpeg (instalado automaticamente no container n8n)

---

## 1. Configurar variáveis de ambiente

```bash
cp .env.example .env
# Editar .env com suas chaves de API
```

---

## 2. Iniciar n8n com Docker

```bash
docker run -it --rm \
  --name n8n-cristao \
  -p 5678:5678 \
  -v "$HOME/nicho-cristao/n8n-data:/home/node/.n8n" \
  -v "$HOME/nicho-cristao:/data" \
  --env-file "$HOME/nicho-cristao/.env" \
  -e N8N_BASIC_AUTH_ACTIVE=true \
  -e N8N_BASIC_AUTH_USER=admin \
  -e N8N_BASIC_AUTH_PASSWORD=senha-aqui \
  -e GENERIC_TIMEZONE=America/Sao_Paulo \
  -e TZ=America/Sao_Paulo \
  n8nio/n8n
```

### Instalar FFmpeg no container n8n

```bash
docker exec -u root -it n8n-cristao apk add --no-cache ffmpeg
# Verificar:
docker exec -it n8n-cristao ffmpeg -version
```

---

## 3. Importar workflows no n8n

1. Acesse `http://localhost:5678`
2. Login: admin / senha configurada
3. **Importar na ordem abaixo** (sub-workflows primeiro):

| Ordem | Arquivo | Tipo |
|-------|---------|------|
| 1 | `workflows/video-automation/sub-content-generation.json` | Sub-workflow |
| 2 | `workflows/video-automation/sub-audio-generation.json` | Sub-workflow |
| 3 | `workflows/video-automation/sub-image-generation.json` | Sub-workflow |
| 4 | `workflows/video-automation/sub-publishing.json` | Sub-workflow |
| 5 | `workflows/video-automation/main-workflow.json` | Workflow principal |

4. Em cada sub-workflow, copie o ID (URL do browser após importar)
5. No `main-workflow.json`, atualize os nós `Execute Workflow` com os IDs corretos

---

## 4. Configurar Credenciais

### Claude API
- Tipo: **Header Auth**
- Header: `x-api-key`
- Value: sua chave `sk-ant-...`

### ElevenLabs
- Tipo: **Header Auth**
- Header: `xi-api-key`
- Value: sua chave ElevenLabs

### YouTube (OAuth2)
- Tipo: **YouTube OAuth2**
- Seguir wizard do n8n para autorização
- Scopes necessários: `youtube.upload`, `youtube.readonly`

### Instagram/Facebook
- Tipo: **Header Auth**
- Usar token de longa duração (60 dias) do Facebook Developer Console
- Documentação: https://developers.facebook.com/docs/instagram-api/getting-started

### TikTok
- Tipo: **Header Auth** com Bearer token
- Documentação: https://developers.tiktok.com/doc/content-posting-api-get-started

---

## 5. Adicionar músicas de fundo

Baixe trilhas royalty-free e coloque em `/data/assets/music/`:

- **Pixabay Music**: https://pixabay.com/music/ (pesquise: "inspirational", "peaceful", "spiritual")
- **YouTube Audio Library**: https://www.youtube.com/audiolibrary
- **FreePD**: https://freepd.com/

Formatos suportados: `.mp3`, `.wav`

---

## 6. Testar o pipeline

### Teste 1: Apenas geração de roteiro (Claude)
Ativar somente o sub-workflow `sub-content-generation.json` manualmente com dados de teste:
```json
{
  "topic": {
    "videoId": "test_001",
    "milagre_de_jesus": "Jesus acalma a tempestade",
    "versiculo_base": "Marcos 4:39",
    "gancho_inicial": "Você já viu o vento obedecer a uma voz?"
  }
}
```

### Teste 2: Apenas áudio (ElevenLabs)
```json
{
  "audioData": {
    "videoId": "test_001",
    "narracao": "Este é um teste de narração para vídeo cristão."
  }
}
```

### Teste 3: Pipeline completo (1 vídeo)
No main-workflow, altere temporariamente `VIDEOS_PER_RUN=1` e dispare via Webhook.

---

## 7. Ativar Schedule

Após validar o pipeline completo:
1. Abrir `main-workflow.json` no n8n
2. Clicar no toggle **Active** no canto superior direito
3. O workflow rodará automaticamente no horário do `SCHEDULE_CRON`

---

## Solução de problemas

### FFmpeg não encontrado
```bash
docker exec -u root -it n8n-cristao which ffmpeg
# Se não encontrar:
docker exec -u root -it n8n-cristao apk add --no-cache ffmpeg
```

### Erro no Claude API: "Invalid JSON"
- Verificar se o prompt está gerando JSON válido
- Testar o sub-content-generation isoladamente
- Aumentar `max_tokens` se o JSON estiver sendo truncado

### ElevenLabs: "Voice not found"
- Verificar o `ELEVENLABS_VOICE_ID` em `.env`
- Listar vozes disponíveis: `GET https://api.elevenlabs.io/v1/voices`

### Nano Banana: falha na geração
- O fallback para Replicate será ativado automaticamente
- Verificar saldo/créditos na conta Nano Banana
- Checar se a API key está correta

### Instagram: vídeo não aceito
- O vídeo precisa estar em URL pública para o Instagram baixar
- Configurar upload para Supabase Storage ou S3 antes de publicar
- Tamanho máximo: 4GB, mínimo 3 segundos

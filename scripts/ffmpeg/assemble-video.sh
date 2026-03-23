#!/usr/bin/env bash
# =============================================================================
# assemble-video.sh
# Monta o vídeo final: cenas + narração + música de fundo
#
# Uso: ./assemble-video.sh <videoId> <tempDir> <outputDir> <assetsDir>
# =============================================================================

set -euo pipefail

VIDEO_ID="${1:?videoId obrigatório}"
TEMP_DIR="${2:-/data/temp}"
OUTPUT_DIR="${3:-/data/output}"
ASSETS_DIR="${4:-/data/assets}"
FFMPEG="${FFMPEG_PATH:-ffmpeg}"

SCENE_DIR="$TEMP_DIR/$VIDEO_ID"
NARRATION="$SCENE_DIR/narration_normalized.mp3"
FINAL_OUTPUT="$OUTPUT_DIR/videos/${VIDEO_ID}_final.mp4"

echo "▶ Iniciando montagem do vídeo: $VIDEO_ID"

# ---------------------------------------------------------------------------
# Passo 1: Criar diretório de saída se não existir
# ---------------------------------------------------------------------------
mkdir -p "$OUTPUT_DIR/videos"

# ---------------------------------------------------------------------------
# Passo 2: Normalizar áudio da narração (loudness -16 LUFS para social media)
# ---------------------------------------------------------------------------
echo "  [1/6] Normalizando áudio..."
$FFMPEG -y \
  -i "$SCENE_DIR/narration.mp3" \
  -af "loudnorm=I=-16:TP=-1.5:LRA=11" \
  "$NARRATION" 2>/dev/null

# ---------------------------------------------------------------------------
# Passo 3: Preparar cada cena (garantir formato correto 1080x1920, 24fps)
# ---------------------------------------------------------------------------
echo "  [2/6] Processando cenas individuais..."
SCENE_INDEX=0
PROCESSED_SCENES=()

for scene_file in "$SCENE_DIR"/scene_*.mp4 "$SCENE_DIR"/scene_*.jpg "$SCENE_DIR"/scene_*.png; do
  [ -f "$scene_file" ] || continue
  SCENE_INDEX=$((SCENE_INDEX + 1))
  PADDED=$(printf "%02d" $SCENE_INDEX)
  PROCESSED="$SCENE_DIR/proc_scene_${PADDED}.mp4"

  ext="${scene_file##*.}"
  if [[ "$ext" == "jpg" || "$ext" == "png" ]]; then
    # Imagem estática → Ken Burns effect (zoom lento)
    $FFMPEG -y -loop 1 -i "$scene_file" -t 6 \
      -vf "zoompan=z='min(zoom+0.0015,1.5)':d=144:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)',scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1,fps=24" \
      -c:v libx264 -preset fast -crf 23 -pix_fmt yuv420p \
      -an "$PROCESSED" 2>/dev/null
  else
    # Vídeo → normalizar resolução e fps
    $FFMPEG -y -i "$scene_file" \
      -vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1,fps=24" \
      -c:v libx264 -preset fast -crf 23 -pix_fmt yuv420p \
      -an "$PROCESSED" 2>/dev/null
  fi

  PROCESSED_SCENES+=("$PROCESSED")
done

if [ ${#PROCESSED_SCENES[@]} -eq 0 ]; then
  echo "  ERRO: Nenhuma cena encontrada em $SCENE_DIR"
  exit 1
fi

echo "  → ${#PROCESSED_SCENES[@]} cenas processadas"

# ---------------------------------------------------------------------------
# Passo 4: Concatenar cenas com crossfade
# ---------------------------------------------------------------------------
echo "  [3/6] Concatenando cenas com crossfade..."

CONCAT_FILE="$SCENE_DIR/concat.txt"
: > "$CONCAT_FILE"
for f in "${PROCESSED_SCENES[@]}"; do
  echo "file '$f'" >> "$CONCAT_FILE"
done

$FFMPEG -y \
  -f concat -safe 0 -i "$CONCAT_FILE" \
  -c:v libx264 -preset fast -crf 20 \
  -pix_fmt yuv420p \
  "$SCENE_DIR/video_concat.mp4" 2>/dev/null

# ---------------------------------------------------------------------------
# Passo 5: Selecionar música de fundo (aleatória do diretório)
# ---------------------------------------------------------------------------
echo "  [4/6] Selecionando música de fundo..."

MUSIC_DIR="$ASSETS_DIR/music"
MUSIC_FILE=""
if [ -d "$MUSIC_DIR" ]; then
  MUSIC_FILE=$(find "$MUSIC_DIR" -name "*.mp3" -o -name "*.wav" | shuf -n 1)
fi

# ---------------------------------------------------------------------------
# Passo 6: Mixar narração + música de fundo
# ---------------------------------------------------------------------------
echo "  [5/6] Mixando áudio (narração + música)..."

if [ -n "$MUSIC_FILE" ] && [ -f "$MUSIC_FILE" ]; then
  $FFMPEG -y \
    -i "$NARRATION" \
    -i "$MUSIC_FILE" \
    -filter_complex \
      "[0:a]volume=1.0[narr];
       [1:a]volume=0.15,afade=t=in:st=0:d=2,afade=t=out:st=28:d=5[music];
       [narr][music]amix=inputs=2:duration=first:dropout_transition=3[aout]" \
    -map "[aout]" \
    -ar 44100 -ac 2 \
    "$SCENE_DIR/mixed_audio.mp3" 2>/dev/null
else
  echo "  ⚠ Música não encontrada, usando apenas narração"
  cp "$NARRATION" "$SCENE_DIR/mixed_audio.mp3"
fi

# ---------------------------------------------------------------------------
# Passo 7: Montar vídeo final (vídeo + áudio misto)
# ---------------------------------------------------------------------------
echo "  [6/6] Gerando vídeo final..."

$FFMPEG -y \
  -i "$SCENE_DIR/video_concat.mp4" \
  -i "$SCENE_DIR/mixed_audio.mp3" \
  -map 0:v -map 1:a \
  -c:v libx264 -profile:v high -level 4.0 \
  -preset medium -crf 18 \
  -pix_fmt yuv420p \
  -c:a aac -b:a 192k -ar 44100 \
  -movflags +faststart \
  -t 40 \
  "$FINAL_OUTPUT"

echo "✅ Vídeo final gerado: $FINAL_OUTPUT"
echo "OUTPUT:$FINAL_OUTPUT"

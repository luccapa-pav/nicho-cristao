#!/usr/bin/env bash
# =============================================================================
# add-subtitles.sh
# Queima legendas no vídeo final (burn-in)
#
# Uso: ./add-subtitles.sh <videoId> <srtFile> <inputVideo> <outputVideo>
# =============================================================================

set -euo pipefail

VIDEO_ID="${1:?videoId obrigatório}"
SRT_FILE="${2:?srtFile obrigatório}"
INPUT_VIDEO="${3:?inputVideo obrigatório}"
OUTPUT_VIDEO="${4:-${INPUT_VIDEO%.*}_subtitled.mp4}"
FFMPEG="${FFMPEG_PATH:-ffmpeg}"

echo "▶ Adicionando legendas ao vídeo: $VIDEO_ID"

$FFMPEG -y \
  -i "$INPUT_VIDEO" \
  -vf "subtitles='$SRT_FILE':force_style='
    FontName=Arial,
    FontSize=20,
    PrimaryColour=&HFFFFFF&,
    OutlineColour=&H000000&,
    BackColour=&H40000000&,
    Bold=1,
    Outline=2,
    Shadow=1,
    Alignment=2,
    MarginV=80
  '" \
  -c:a copy \
  "$OUTPUT_VIDEO"

echo "✅ Vídeo com legendas: $OUTPUT_VIDEO"
echo "OUTPUT:$OUTPUT_VIDEO"

# FFmpeg — Referência de Comandos

## Comandos úteis para testes manuais

### Verificar informações de um vídeo
```bash
ffprobe -v quiet -print_format json -show_format -show_streams video.mp4
```

### Converter imagem para vídeo com Ken Burns effect (zoom lento)
```bash
ffmpeg -loop 1 -i scene.jpg -t 6 \
  -vf "zoompan=z='min(zoom+0.0015,1.5)':d=144:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)',scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1,fps=24" \
  -c:v libx264 -preset fast -crf 23 -pix_fmt yuv420p -an \
  scene_animated.mp4
```

### Normalizar resolução para 1080x1920 (vertical)
```bash
ffmpeg -i input.mp4 \
  -vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1,fps=24" \
  -c:v libx264 -preset fast -crf 23 -pix_fmt yuv420p \
  -an output.mp4
```

### Concatenar vídeos sem reencoding (se mesmo formato)
```bash
# Criar lista
echo "file 'scene_01.mp4'" > concat.txt
echo "file 'scene_02.mp4'" >> concat.txt
echo "file 'scene_03.mp4'" >> concat.txt

ffmpeg -f concat -safe 0 -i concat.txt -c copy output.mp4
```

### Concatenar com reencoding (formatos mistos)
```bash
ffmpeg -f concat -safe 0 -i concat.txt \
  -c:v libx264 -preset fast -crf 20 -pix_fmt yuv420p \
  -an output.mp4
```

### Normalizar volume de áudio (LUFS -16 para social media)
```bash
ffmpeg -i narration.mp3 \
  -af "loudnorm=I=-16:TP=-1.5:LRA=11" \
  narration_normalized.mp3
```

### Mixar narração + música de fundo
```bash
ffmpeg -y \
  -i narration.mp3 \
  -i background_music.mp3 \
  -filter_complex \
    "[0:a]volume=1.0[narr];
     [1:a]volume=0.15,afade=t=in:st=0:d=2,afade=t=out:st=28:d=5[music];
     [narr][music]amix=inputs=2:duration=first:dropout_transition=3[aout]" \
  -map "[aout]" \
  -ar 44100 -ac 2 \
  mixed_audio.mp3
```

### Combinar vídeo sem som + áudio
```bash
ffmpeg -y \
  -i video_no_audio.mp4 \
  -i mixed_audio.mp3 \
  -map 0:v -map 1:a \
  -c:v libx264 -profile:v high -level 4.0 \
  -preset medium -crf 18 \
  -pix_fmt yuv420p \
  -c:a aac -b:a 192k -ar 44100 \
  -movflags +faststart \
  -t 40 \
  final_output.mp4
```

### Crossfade entre cenas (5 cenas, 0.5s de crossfade)
```bash
ffmpeg \
  -i s1.mp4 -i s2.mp4 -i s3.mp4 -i s4.mp4 -i s5.mp4 \
  -filter_complex "
    [0:v]trim=duration=5.5,setpts=PTS-STARTPTS[v0];
    [1:v]trim=duration=5.5,setpts=PTS-STARTPTS[v1];
    [2:v]trim=duration=5.5,setpts=PTS-STARTPTS[v2];
    [3:v]trim=duration=5.5,setpts=PTS-STARTPTS[v3];
    [4:v]trim=duration=5.5,setpts=PTS-STARTPTS[v4];
    [v0][v1]xfade=transition=fade:duration=0.5:offset=5.0[x1];
    [x1][v2]xfade=transition=fade:duration=0.5:offset=10.0[x2];
    [x2][v3]xfade=transition=fade:duration=0.5:offset=15.0[x3];
    [x3][v4]xfade=transition=fade:duration=0.5:offset=20.0[xfinal]
  " \
  -map "[xfinal]" \
  video_crossfade.mp4
```

### Queimar legendas no vídeo (burn-in subtitles)
```bash
ffmpeg -i input.mp4 \
  -vf "subtitles=subtitles.srt:force_style='FontName=Arial,FontSize=20,PrimaryColour=&HFFFFFF&,OutlineColour=&H000000&,Bold=1,Outline=2,Shadow=1,Alignment=2,MarginV=80'" \
  -c:a copy \
  output_subtitled.mp4
```

### Encode final para Instagram/TikTok (compliance)
```bash
ffmpeg -i input.mp4 \
  -c:v libx264 -profile:v high -level 4.0 \
  -pix_fmt yuv420p \
  -b:v 8M -maxrate 8M -bufsize 16M \
  -c:a aac -b:a 192k -ar 44100 \
  -movflags +faststart \
  output_instagram.mp4
```

### Cortar vídeo em duração específica
```bash
ffmpeg -i input.mp4 -ss 00:00:00 -t 00:00:35 -c copy output_35s.mp4
```

### Verificar duração
```bash
ffprobe -v quiet -show_entries format=duration -of csv=p=0 video.mp4
```

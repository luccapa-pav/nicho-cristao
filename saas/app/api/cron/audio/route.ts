import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";
import { GoogleGenerativeAI } from "@google/generative-ai";

const VOICE_ID = process.env.ELEVENLABS_VOICE_ID ?? "pNInz6obpgDQGcFmaJgB";
const MODEL_ID = "eleven_multilingual_v2";

// ── Gemini: gera o roteiro da meditação guiada (~3-4 min) ─────────────────
async function generateMeditationScript(
  title: string,
  verse: string,
  verseRef: string,
  theme: string | null
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY não configurada");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `Você é um guia espiritual católico carismático com voz calorosa e acolhedora.
Escreva um roteiro de meditação guiada em português brasileiro para ser narrado em áudio (3 a 4 minutos).
O texto será enviado diretamente ao ElevenLabs para narração — escreva APENAS o texto narrado, sem títulos, sem marcações, sem colchetes, sem indicações de pausa.
Use linguagem simples, íntima e encorajadora. Fale diretamente com o ouvinte (use "você").

Devocional de hoje:
Título: ${title}
Versículo: "${verse}" — ${verseRef}
${theme ? `Tema: ${theme}` : ""}

Estrutura obrigatória (sem marcadores visíveis):
1. Saudação calorosa e convite ao silêncio (2-3 frases)
2. Leitura pausada do versículo completo
3. Reflexão sobre o significado (contexto bíblico, o que Deus quer dizer)
4. Aplicação prática: como viver isso hoje
5. Momento de oração guiada (fale como se estivesse orando junto com o ouvinte)
6. Bênção de encerramento (2-3 frases)

Escreva o roteiro agora:`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

// ── ElevenLabs: converte texto em áudio mp3 ────────────────────────────────
async function textToSpeech(text: string): Promise<{ buffer: ArrayBuffer; durationSeconds: number }> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error("ELEVENLABS_API_KEY não configurada");

  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: MODEL_ID,
      voice_settings: { stability: 0.80, similarity_boost: 0.75, style: 0.05, use_speaker_boost: false },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`ElevenLabs ${res.status}: ${err}`);
  }

  const buffer = await res.arrayBuffer();
  const wordCount = text.split(/\s+/).length;
  const durationSeconds = Math.round((wordCount / 130) * 60);
  return { buffer, durationSeconds };
}

// ── Handler principal ──────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const isVercel = req.headers.get("x-vercel-cron") === "1";
  if (!isVercel && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Processa hoje + próximos 2 dias como buffer
  const results: { date: string; status: string }[] = [];

  for (let offset = 0; offset <= 2; offset++) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + offset);
    const nextDay = new Date(date.getTime() + 86400000);
    const dateStr = date.toISOString().slice(0, 10);

    const devotional = await prisma.devotional.findFirst({
      where: { date: { gte: date, lt: nextDay } },
    });

    if (!devotional) {
      results.push({ date: dateStr, status: "sem devocional" });
      continue;
    }

    const needsFull    = !devotional.audioUrl;
    const needsPreview = !devotional.audioPreviewUrl;

    if (!needsFull && !needsPreview) {
      results.push({ date: dateStr, status: "já tem áudio" });
      continue;
    }

    try {
      // ── Preview: apenas o versículo narrado (~15s, free) ──
      if (needsPreview) {
        const previewText = `"${devotional.verse}" — ${devotional.verseRef}`;
        const { buffer } = await textToSpeech(previewText);
        const blob = await put(`audio/previews/${dateStr}.mp3`, buffer, {
          access: "public",
          contentType: "audio/mpeg",
        });
        await prisma.devotional.update({
          where: { id: devotional.id },
          data: { audioPreviewUrl: blob.url },
        });
      }

      // ── Full: meditação guiada (~3-4 min, premium) ──
      if (needsFull) {
        const script = await generateMeditationScript(
          devotional.title,
          devotional.verse,
          devotional.verseRef,
          devotional.theme
        );
        const { buffer, durationSeconds } = await textToSpeech(script);
        const blob = await put(`audio/devotionals/${dateStr}.mp3`, buffer, {
          access: "public",
          contentType: "audio/mpeg",
        });
        await prisma.devotional.update({
          where: { id: devotional.id },
          data: { audioUrl: blob.url, audioDuration: durationSeconds },
        });
      }

      results.push({ date: dateStr, status: "gerado" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      results.push({ date: dateStr, status: `erro: ${msg}` });
    }
  }

  return NextResponse.json({ results });
}

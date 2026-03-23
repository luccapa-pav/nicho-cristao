/**
 * Gera 365 devocionais usando Gemini e salva em prisma/data/devotionals.json
 * Uso: GEMINI_API_KEY=sua_chave tsx prisma/generate-devotionals.ts
 * Resumível: se o JSON já existir, continua de onde parou.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error("❌ Defina GEMINI_API_KEY antes de rodar.");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

interface Devotional {
  day: number;
  title: string;
  verse: string;
  verseRef: string;
  theme: string;
  reflection: string;
}

const THEMES = [
  "Confiança", "Gratidão", "Esperança", "Amor", "Fé", "Oração", "Força",
  "Paz", "Graça", "Propósito", "Obediência", "Presença de Deus", "Salvação",
  "Louvor", "Renovação", "Sabedoria", "Misericórdia", "Humildade", "Perseverança", "Alegria",
];

const BATCH_SIZE = 30;
const TOTAL = 365;
const OUT_PATH = path.join(__dirname, "data", "devotionals.json");

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function generateBatch(startDay: number, count: number): Promise<Devotional[]> {
  const themeList = Array.from({ length: count }, (_, i) =>
    THEMES[(startDay - 1 + i) % THEMES.length]
  );

  const prompt = `Você é um pastor evangélico brasileiro escrevendo devocionais diários para um app cristão chamado "Luz Divina". O público são cristãos brasileiros de todas as idades.

Gere ${count} devocionais únicos e distintos (dias ${startDay} a ${startDay + count - 1} de um plano anual).

Regras obrigatórias:
- Versículos reais da Bíblia (ARC ou NVI), com referência exata (ex: "João 3:16")
- Títulos poéticos e inspiradores em português
- Reflexão de 2 a 3 frases curtas, práticas e edificantes
- Não repetir versículos entre os lotes
- Temas desta leva: ${themeList.join(", ")}

Responda APENAS com JSON válido, sem markdown, neste formato exato:
[
  {
    "day": ${startDay},
    "title": "Título do Devocional",
    "verse": "Texto completo do versículo.",
    "verseRef": "Livro Capítulo:Versículo",
    "theme": "Tema",
    "reflection": "Frase de reflexão 1. Frase de reflexão 2. Frase de reflexão 3."
  }
]`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();
  const clean = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();

  try {
    return JSON.parse(clean) as Devotional[];
  } catch {
    console.error(`❌ JSON inválido no lote ${startDay}–${startDay + count - 1}:\n`, clean.slice(0, 300));
    throw new Error("Falha ao parsear resposta do Gemini");
  }
}

async function main() {
  // Carrega progresso anterior se existir
  let all: Devotional[] = [];
  if (fs.existsSync(OUT_PATH)) {
    all = JSON.parse(fs.readFileSync(OUT_PATH, "utf-8"));
    console.log(`♻️  Retomando de onde parou — ${all.length} devocionais já gerados.\n`);
  } else {
    console.log("✨ Gerando 365 devocionais com Gemini...\n");
  }

  const doneSet = new Set(all.map((d) => d.day));
  let day = 1;

  while (day <= TOTAL) {
    const count = Math.min(BATCH_SIZE, TOTAL - day + 1);

    // Pula lotes já completos
    const batchDays = Array.from({ length: count }, (_, i) => day + i);
    if (batchDays.every((d) => doneSet.has(d))) {
      day += count;
      continue;
    }

    process.stdout.write(`📖 Lote ${day}–${day + count - 1}... `);

    let attempts = 0;
    while (attempts < 4) {
      try {
        const batch = await generateBatch(day, count);
        all.push(...batch);
        batch.forEach((d) => doneSet.add(d.day));
        // Salva após cada lote para não perder progresso
        fs.writeFileSync(OUT_PATH, JSON.stringify(all, null, 2), "utf-8");
        console.log(`✅ (${batch.length} gerados — total: ${all.length})`);
        break;
      } catch (err: unknown) {
        attempts++;
        const is429 = String(err).includes("429");
        const waitSec = is429 ? 30 * attempts : 5;
        console.error(`\n⚠️  Tentativa ${attempts}/4 falhou. Aguardando ${waitSec}s...`);
        await sleep(waitSec * 1000);
        if (attempts === 4) throw err;
      }
    }

    day += count;

    // Pausa entre lotes para evitar rate limit
    if (day <= TOTAL) await sleep(8000);
  }

  console.log(`\n🎉 ${all.length} devocionais salvos em prisma/data/devotionals.json`);
}

main().catch((e) => { console.error(e); process.exit(1); });

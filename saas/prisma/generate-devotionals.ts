/**
 * Gera 365 devocionais usando Gemini e salva em prisma/data/devotionals.json
 * Uso: GEMINI_API_KEY=sua_chave tsx prisma/generate-devotionals.ts
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
  day: number; // 1–365, sendo 1 = hoje
  title: string;
  verse: string;
  verseRef: string;
  theme: string;
  reflection: string; // 2–3 frases de reflexão
}

const THEMES = [
  "Confiança", "Gratidão", "Esperança", "Amor", "Fé", "Oração", "Força",
  "Paz", "Graça", "Propósito", "Obediência", "Presença de Deus", "Salvação",
  "Louvor", "Renovação", "Sabedoria", "Misericórdia", "Humildade", "Perseverança", "Alegria",
];

// Gera em lotes de 30 para não estourar o contexto
const BATCH_SIZE = 30;
const TOTAL = 365;

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
  },
  ...
]`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  // Remove possíveis blocos de markdown que o modelo às vezes inclui
  const clean = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();

  try {
    return JSON.parse(clean) as Devotional[];
  } catch {
    console.error(`❌ JSON inválido no lote ${startDay}–${startDay + count - 1}:\n`, clean.slice(0, 300));
    throw new Error("Falha ao parsear resposta do Gemini");
  }
}

async function main() {
  console.log("✨ Gerando 365 devocionais com Gemini...\n");

  const all: Devotional[] = [];
  let day = 1;

  while (day <= TOTAL) {
    const count = Math.min(BATCH_SIZE, TOTAL - day + 1);
    process.stdout.write(`📖 Lote ${day}–${day + count - 1}... `);

    try {
      const batch = await generateBatch(day, count);
      all.push(...batch);
      console.log(`✅ (${batch.length} gerados)`);
    } catch (err) {
      console.error(`\n⚠️  Erro no lote ${day}. Tentando novamente em 5s...`);
      await new Promise((r) => setTimeout(r, 5000));
      const batch = await generateBatch(day, count);
      all.push(...batch);
      console.log(`✅ (${batch.length} gerados na 2ª tentativa)`);
    }

    day += count;

    // Pausa entre lotes para evitar rate limit
    if (day <= TOTAL) await new Promise((r) => setTimeout(r, 1500));
  }

  // Salva no arquivo
  const outPath = path.join(__dirname, "data", "devotionals.json");
  fs.writeFileSync(outPath, JSON.stringify(all, null, 2), "utf-8");

  console.log(`\n🎉 ${all.length} devocionais salvos em prisma/data/devotionals.json`);
}

main().catch((e) => { console.error(e); process.exit(1); });

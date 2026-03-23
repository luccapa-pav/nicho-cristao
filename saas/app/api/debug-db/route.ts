import { NextResponse } from "next/server";

const PASS = "30118y70w6t9%25HAGHGDSUPA";
const REF  = "foduvavdzepasiyoozrq";
const REGIONS = [
  "ap-southeast-2",
  "ap-southeast-1",
  "ap-northeast-1",
  "eu-west-1",
  "eu-west-2",
  "eu-central-1",
  "us-west-1",
];

export async function GET() {
  const { PrismaClient } = await import("@prisma/client");
  const results: Record<string, string> = {};

  for (const region of REGIONS) {
    const url = `postgresql://postgres.${REF}:${PASS}@aws-0-${region}.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&connect_timeout=5`;
    const client = new PrismaClient({ datasources: { db: { url } } });
    try {
      await client.$queryRaw`SELECT 1`;
      results[region] = "SUCCESS";
      await client.$disconnect();
      break;
    } catch (e: unknown) {
      results[region] = e instanceof Error ? e.message.slice(0, 100) : "error";
      try { await client.$disconnect(); } catch { /* ignore */ }
    }
  }

  return NextResponse.json(results);
}

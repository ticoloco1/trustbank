import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 300; // 5 min para várias URLs
export const dynamic = "force-dynamic";

const BASE = process.env.NEXT_PUBLIC_APP_URL || "https://trustbank.xyz";

/**
 * GET /api/cron/prewarm
 * Chama o prerender para as URLs do sitemap (preenche o cache KV).
 * Protegido por CRON_SECRET. Configurar no Vercel Cron: 0 * * * * (a cada hora).
 */
export async function GET(request: NextRequest) {
  const secret = request.headers.get("authorization")?.replace("Bearer ", "") || request.nextUrl.searchParams.get("secret");
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let urls: string[];
  try {
    const res = await fetch(`${BASE}/sitemap.xml`);
    const xml = await res.text();
    urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    if (urls.length === 0) urls = [BASE, `${BASE}/slugs`, `${BASE}/market`];
  } catch {
    urls = [BASE, `${BASE}/slugs`, `${BASE}/market`];
  }

  const limit = 30; // evita timeout
  const toWarm = urls.slice(0, limit);
  const auth = process.env.CRON_SECRET ? { headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` } } : {};
  const results: { url: string; ok: boolean }[] = [];

  for (const url of toWarm) {
    try {
      const r = await fetch(`${BASE}/api/prerender?url=${encodeURIComponent(url)}`, auth);
      results.push({ url, ok: r.ok });
    } catch (e) {
      results.push({ url, ok: false });
    }
  }

  return NextResponse.json({ warmed: results.length, results });
}

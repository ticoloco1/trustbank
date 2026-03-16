import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

const BASE = process.env.NEXT_PUBLIC_APP_URL || "https://trustbank.xyz";

/**
 * GET /api/prerender?url=https://trustbank.xyz/s/meu-slug
 * Renderiza a URL com headless Chromium e guarda no KV.
 * Protegido por CRON_SECRET ou só aceita URLs do próprio domínio.
 */
export async function GET(request: NextRequest) {
  const secret = request.headers.get("authorization")?.replace("Bearer ", "") || request.nextUrl.searchParams.get("secret");
  const expectedSecret = process.env.CRON_SECRET;
  if (expectedSecret && secret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  const baseOrigin = new URL(BASE).origin;
  if (parsed.origin !== baseOrigin) {
    return NextResponse.json({ error: "Only same-origin URLs allowed" }, { status: 400 });
  }

  const pathname = parsed.pathname || "/";
  const key = `prerender:${pathname}`;

  try {
    const chromium = await import("@sparticuz/chromium");
    const puppeteer = await import("puppeteer-core");

    const browser = await (puppeteer as typeof import("puppeteer-core")).default.launch({
      args: chromium.default.args,
      defaultViewport: { width: 1280, height: 720 },
      executablePath: await chromium.default.executablePath(),
      headless: true,
    });

    const page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (compatible; TrustBankPrerender/1.0)");
    await page.goto(url, { waitUntil: "networkidle0", timeout: 30000 });
    const html = await page.content();
    await browser.close();

    await kv.set(key, html, { ex: 86400 }); // TTL 24h

    return NextResponse.json({ ok: true, pathname, cached: true });
  } catch (e) {
    console.error("Prerender error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Prerender failed" },
      { status: 500 }
    );
  }
}

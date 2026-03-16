import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

/**
 * POST /api/analytics/track
 * Registra evento (page view, click). Body: mini_site_id, path?, event_type?, visitor_key?, referrer?, click_label?
 */
export async function POST(request: NextRequest) {
  const prisma = getPrisma();
  if (!prisma) return NextResponse.json({ ok: false }, { status: 503 });

  try {
    const body = (await request.json()) as {
      mini_site_id?: string;
      path?: string;
      event_type?: string;
      visitor_key?: string;
      referrer?: string;
      click_label?: string;
    };
    const mini_site_id = body.mini_site_id?.trim();
    if (!mini_site_id) {
      return NextResponse.json({ error: "mini_site_id required" }, { status: 400 });
    }

    const path = (body.path ?? "/").trim() || "/";
    const event_type = (body.event_type ?? "page_view").trim() || "page_view";
    const visitor_key = body.visitor_key?.trim() || null;
    const referrer = body.referrer?.trim().slice(0, 500) || null;
    const click_label = body.click_label?.trim().slice(0, 200) || null;

    await prisma.miniSiteAnalyticsEvent.create({
      data: { mini_site_id, path, event_type, visitor_key, referrer, click_label },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[analytics/track]", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

/**
 * GET /api/analytics?mini_site_id=xxx&from=YYYY-MM-DD&to=YYYY-MM-DD
 * Retorna estatísticas agregadas do mini site: total de views, visitantes únicos, por página e por dia.
 */
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const prisma = getPrisma();
  if (!prisma) return NextResponse.json({ error: "Prisma not configured" }, { status: 503 });

  const mini_site_id = request.nextUrl.searchParams.get("mini_site_id");
  if (!mini_site_id) {
    return NextResponse.json({ error: "mini_site_id required" }, { status: 400 });
  }

  const fromParam = request.nextUrl.searchParams.get("from");
  const toParam = request.nextUrl.searchParams.get("to");
  let fromDate: Date | null = null;
  let toDate: Date | null = null;
  if (fromParam) {
    fromDate = new Date(fromParam);
    if (isNaN(fromDate.getTime())) fromDate = null;
  }
  if (toParam) {
    toDate = new Date(toParam);
    toDate.setHours(23, 59, 59, 999);
    if (isNaN(toDate.getTime())) toDate = null;
  }

  const where: { mini_site_id: string; created_at?: { gte?: Date; lte?: Date } } = {
    mini_site_id,
  };
  if (fromDate || toDate) {
    where.created_at = {};
    if (fromDate) where.created_at.gte = fromDate;
    if (toDate) where.created_at.lte = toDate;
  }

  const events = await prisma.miniSiteAnalyticsEvent.findMany({
    where,
    select: { path: true, visitor_key: true, created_at: true, event_type: true, referrer: true, click_label: true },
    orderBy: { created_at: "asc" },
  });

  const pageViews = events.filter((e) => e.event_type === "page_view");
  const total_views = pageViews.length;
  const unique_visitors = new Set(events.map((e) => e.visitor_key).filter(Boolean)).size;

  const by_path: Record<string, { views: number; uniques: number }> = {};
  for (const e of pageViews) {
    const p = e.path || "/";
    if (!by_path[p]) by_path[p] = { views: 0, uniques: 0 };
    by_path[p].views += 1;
  }
  for (const p of Object.keys(by_path)) {
    const visitors = new Set(pageViews.filter((e) => (e.path || "/") === p && e.visitor_key).map((e) => e.visitor_key));
    by_path[p].uniques = visitors.size;
  }

  const by_day: Record<string, { views: number; uniques: number }> = {};
  for (const e of pageViews) {
    const day = e.created_at.toISOString().slice(0, 10);
    if (!by_day[day]) by_day[day] = { views: 0, uniques: 0 };
    by_day[day].views += 1;
  }
  for (const day of Object.keys(by_day)) {
    const dayEvents = pageViews.filter((e) => e.created_at.toISOString().slice(0, 10) === day);
    by_day[day].uniques = new Set(dayEvents.map((e) => e.visitor_key).filter(Boolean)).size;
  }

  const by_referrer: Record<string, number> = {};
  for (const e of pageViews) {
    const r = e.referrer || "direct";
    by_referrer[r] = (by_referrer[r] || 0) + 1;
  }

  const clicks = events.filter((e) => e.event_type === "click").slice(-50).reverse();

  return NextResponse.json({
    mini_site_id,
    total_views,
    unique_visitors,
    by_path: Object.entries(by_path).map(([path, v]) => ({ path, ...v })),
    by_day: Object.entries(by_day)
      .map(([date, v]) => ({ date, ...v }))
      .sort((a, b) => a.date.localeCompare(b.date)),
    by_referrer: Object.entries(by_referrer).map(([source, views]) => ({ source, views })).sort((a, b) => b.views - a.views),
    recent_clicks: clicks.map((c) => ({ path: c.path, label: c.click_label, at: c.created_at.toISOString() })),
  });
}

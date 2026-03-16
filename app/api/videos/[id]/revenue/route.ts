import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

/**
 * GET /api/videos/[id]/revenue — lista eventos de receita e distribuições (rateio).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const prisma = getPrisma();
  if (!prisma) return NextResponse.json({ error: "Prisma not configured" }, { status: 503 });
  const { id: videoId } = await params;

  const events = await prisma.videoRevenueEvent.findMany({
    where: { video_id: videoId },
    orderBy: { period_start: "desc" },
    include: { distributions: true },
  });
  return NextResponse.json(events);
}

/**
 * POST /api/videos/[id]/revenue — (admin/cron) registrar receita do período e calcular rateio.
 * Body: { period_start (ISO), period_end (ISO), amount_usdc, source? }
 * Calcula participação de cada holder no período e cria VideoRevenueDistribution.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const prisma = getPrisma();
  if (!prisma) return NextResponse.json({ error: "Prisma not configured" }, { status: 503 });
  const { id: videoId } = await params;
  const body = (await request.json()) as {
    period_start?: string;
    period_end?: string;
    amount_usdc?: string;
    source?: string;
  };

  const periodStart = body.period_start ? new Date(body.period_start) : null;
  const periodEnd = body.period_end ? new Date(body.period_end) : null;
  const amountUsdc = body.amount_usdc?.trim();
  const source = body.source ?? "youtube_ads";

  if (!periodStart || !periodEnd || !amountUsdc) {
    return NextResponse.json({ error: "period_start, period_end, amount_usdc required" }, { status: 400 });
  }

  const amount = parseFloat(amountUsdc);
  if (Number.isNaN(amount) || amount < 0) {
    return NextResponse.json({ error: "amount_usdc must be a positive number" }, { status: 400 });
  }

  const video = await prisma.video.findUnique({
    where: { id: videoId },
    include: { quotation: true, share_holdings: true },
  });
  if (!video) return NextResponse.json({ error: "Video not found" }, { status: 404 });

  if (video.delisted_at) {
    return NextResponse.json(
      { error: "Video was delisted (creator removed). No new revenue can be added. Distributions are frozen." },
      { status: 400 }
    );
  }

  const q = video.quotation;
  const totalShares = q?.total_shares ?? 1_000_000;
  const systemPercent = q?.system_percent ?? 20;
  const systemShares = Math.floor((totalShares * systemPercent) / 100);
  // Total "ativo" = system shares + soma dos holdings (investidores)
  const totalHeldByInvestors = video.share_holdings.reduce((s, h) => s + h.shares, 0);
  const totalActiveShares = systemShares + totalHeldByInvestors;
  if (totalActiveShares === 0) {
    return NextResponse.json({ error: "No shares to distribute" }, { status: 400 });
  }

  const event = await prisma.videoRevenueEvent.create({
    data: {
      video_id: videoId,
      period_start: periodStart,
      period_end: periodEnd,
      amount_usdc: amountUsdc,
      source,
    },
  });

  const distributions: { revenue_event_id: string; holder_wallet: string; shares_at_time: number; revenue_amount_usdc: string }[] = [];

  // Sistema recebe (system_shares / totalActiveShares) * amount
  const systemAmount = (systemShares / totalActiveShares) * amount;
  distributions.push({
    revenue_event_id: event.id,
    holder_wallet: "0x_system",
    shares_at_time: systemShares,
    revenue_amount_usdc: systemAmount.toFixed(2),
  });

  for (const h of video.share_holdings) {
    const shareAmount = (h.shares / totalActiveShares) * amount;
    distributions.push({
      revenue_event_id: event.id,
      holder_wallet: h.owner_wallet,
      shares_at_time: h.shares,
      revenue_amount_usdc: shareAmount.toFixed(2),
    });
  }

  await prisma.videoRevenueDistribution.createMany({ data: distributions });

  // Atualiza revenue acumulado na cotação
  const currentRevenue = parseFloat(q?.revenue_usdc ?? "0") || 0;
  await prisma.videoQuotation.updateMany({
    where: { video_id: videoId },
    data: { revenue_usdc: (currentRevenue + amount).toFixed(2) },
  });

  return NextResponse.json({
    ok: true,
    event_id: event.id,
    amount_usdc: amountUsdc,
    distributions_count: distributions.length,
    system_receives: systemAmount.toFixed(2),
  });
}

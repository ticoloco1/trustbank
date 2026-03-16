import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

/**
 * GET /api/credits/summary?wallet=0x...
 * Saldo, total depositado, total retirado, e cotas por vídeo (shares compradas/vendidas).
 */
export async function GET(request: NextRequest) {
  const prisma = getPrisma();
  if (!prisma) return NextResponse.json({ error: "Prisma not configured" }, { status: 503 });
  const wallet = request.nextUrl.searchParams.get("wallet")?.trim().toLowerCase();
  if (!wallet?.startsWith("0x")) {
    return NextResponse.json({ error: "wallet required" }, { status: 400 });
  }

  const balanceRow = await prisma.creditBalance.findUnique({
    where: { wallet },
  });
  const balance_usdc = balanceRow?.balance_usdc ?? "0";

  const txs = await prisma.creditTransaction.findMany({
    where: { wallet },
    orderBy: { created_at: "asc" },
  });
  let total_deposited = 0;
  let total_withdrawn = 0;
  for (const t of txs) {
    const amt = parseFloat(t.amount_usdc);
    if (t.type === "deposit" && amt > 0) total_deposited += amt;
    if (t.type === "withdrawal") total_withdrawn += Math.abs(amt);
    if (t.type === "share_sell" && amt > 0) total_deposited += amt;
  }

  const holdings = await prisma.videoShareHolding.findMany({
    where: { owner_wallet: wallet },
    include: { video: { select: { id: true, title: true, youtube_id: true }, include: { quotation: { select: { ticker_symbol: true } } } } },
  });

  return NextResponse.json({
    wallet,
    balance_usdc,
    total_deposited: total_deposited.toFixed(2),
    total_withdrawn: total_withdrawn.toFixed(2),
    shares: holdings.map((h) => ({
      video_id: h.video_id,
      video_title: h.video.title,
      ticker: h.video.quotation?.ticker_symbol,
      shares: h.shares,
    })),
  });
}

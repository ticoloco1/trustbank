import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { debit } from "@/lib/credits";

/**
 * POST /api/videos/[id]/shares/buy — comprar cotas do pool inicial (IPO) com créditos TrustBank.
 * Body: { wallet, amount_shares }
 * 1 crédito = 1 USDC. Preço por share = valuation_usdc / total_shares.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const prisma = getPrisma();
  if (!prisma) return NextResponse.json({ error: "Prisma not configured" }, { status: 503 });
  const { id: videoId } = await params;
  const body = (await request.json()) as { wallet?: string; amount_shares?: number };

  const wallet = body.wallet?.trim().toLowerCase();
  const amountShares = typeof body.amount_shares === "number" ? body.amount_shares : parseInt(String(body.amount_shares), 10);

  if (!wallet?.startsWith("0x") || !amountShares || amountShares < 1) {
    return NextResponse.json({ error: "wallet and amount_shares (>=1) required" }, { status: 400 });
  }

  const video = await prisma.video.findUnique({
    where: { id: videoId },
    include: { quotation: true, share_holdings: true },
  });
  if (!video) return NextResponse.json({ error: "Video not found" }, { status: 404 });

  const q = video.quotation;
  if (!q) return NextResponse.json({ error: "Video has no quotation (configure valuation first)" }, { status: 400 });

  const totalShares = q.total_shares ?? 1_000_000;
  const sellablePercent = q.sellable_percent ?? 70;
  const sellableShares = Math.floor((totalShares * sellablePercent) / 100);
  const totalHeld = video.share_holdings.reduce((s, h) => s + h.shares, 0);
  const available = Math.max(0, sellableShares - totalHeld);

  if (amountShares > available) {
    return NextResponse.json({ error: `Only ${available} shares available from pool` }, { status: 400 });
  }

  const valuation = parseFloat(q.valuation_usdc ?? "0") || 0;
  const pricePerShare = totalShares > 0 ? valuation / totalShares : 0;
  const totalUsdc = (pricePerShare * amountShares).toFixed(2);

  const debitResult = await debit(prisma, wallet, totalUsdc, "share_buy", "video_share_pool", videoId);
  if (!debitResult.ok) {
    return NextResponse.json({ error: debitResult.error, code: "insufficient_credits" }, { status: 400 });
  }

  await prisma.videoShareHolding.upsert({
    where: { video_id_owner_wallet: { video_id: videoId, owner_wallet: wallet } },
    create: { video_id: videoId, owner_wallet: wallet, shares: amountShares },
    update: { shares: { increment: amountShares } },
  });

  return NextResponse.json({
    ok: true,
    amount_shares: amountShares,
    price_per_share_usdc: pricePerShare.toFixed(4),
    total_credits_usdc: totalUsdc,
    balance_after: debitResult.balance_after,
  });
}

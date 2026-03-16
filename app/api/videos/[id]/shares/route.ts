import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

/**
 * GET /api/videos/[id]/shares — book + cotação + participações.
 * Query: ?wallet=0x... para incluir "my_holdings" e "my_orders".
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const prisma = getPrisma();
  if (!prisma) return NextResponse.json({ error: "Prisma not configured" }, { status: 503 });
  const { id: videoId } = await params;
  const wallet = request.nextUrl.searchParams.get("wallet")?.toLowerCase();

  const video = await prisma.video.findUnique({
    where: { id: videoId },
    include: {
      quotation: true,
      share_holdings: true,
      share_orders: { where: { status: "active" }, orderBy: { created_at: "asc" } },
    },
  });
  if (!video) return NextResponse.json({ error: "Video not found" }, { status: 404 });

  const q = video.quotation;
  const totalShares = q?.total_shares ?? 1_000_000;
  const systemPercent = q?.system_percent ?? 20;
  const sellablePercent = q?.sellable_percent ?? 70;
  const systemShares = Math.floor((totalShares * systemPercent) / 100);
  const sellableShares = Math.floor((totalShares * sellablePercent) / 100);
  const totalHeld = video.share_holdings.reduce((s, h) => s + h.shares, 0);
  const availableFromPool = Math.max(0, sellableShares - totalHeld);

  const sellOrders = video.share_orders.filter((o) => o.order_type === "sell");
  const buyOrders = video.share_orders.filter((o) => o.order_type === "buy");

  const out: Record<string, unknown> = {
    video_id: videoId,
    quotation: q,
    total_shares: totalShares,
    system_percent: systemPercent,
    sellable_percent: sellablePercent,
    system_shares: systemShares,
    sellable_shares: sellableShares,
    total_held: totalHeld,
    available_from_pool: availableFromPool,
    order_book: {
      sell: sellOrders.map((o) => ({ id: o.id, wallet: o.wallet, amount_shares: o.amount_shares, price_per_share_usdc: o.price_per_share_usdc, created_at: o.created_at })),
      buy: buyOrders.map((o) => ({ id: o.id, wallet: o.wallet, amount_shares: o.amount_shares, price_per_share_usdc: o.price_per_share_usdc, created_at: o.created_at })),
    },
    holdings_count: video.share_holdings.length,
  };

  if (wallet) {
    const myHolding = video.share_holdings.find((h) => h.owner_wallet.toLowerCase() === wallet);
    const myOrders = video.share_orders.filter((o) => o.wallet.toLowerCase() === wallet);
    (out as Record<string, unknown>).my_holdings = myHolding ? myHolding.shares : 0;
    (out as Record<string, unknown>).my_orders = myOrders.map((o) => ({ id: o.id, order_type: o.order_type, amount_shares: o.amount_shares, price_per_share_usdc: o.price_per_share_usdc, status: o.status }));
  }

  return NextResponse.json(out);
}

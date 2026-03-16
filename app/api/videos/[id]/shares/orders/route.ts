import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

/**
 * POST /api/videos/[id]/shares/orders — criar ordem de venda ou compra.
 * Body: { wallet, order_type: 'sell'|'buy', amount_shares, price_per_share_usdc }
 * Venda: verifica se wallet tem amount_shares em VideoShareHolding.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const prisma = getPrisma();
  if (!prisma) return NextResponse.json({ error: "Prisma not configured" }, { status: 503 });
  const { id: videoId } = await params;
  const body = (await request.json()) as {
    wallet?: string;
    order_type?: string;
    amount_shares?: number;
    price_per_share_usdc?: string;
  };

  const wallet = body.wallet?.trim().toLowerCase();
  const orderType = body.order_type === "buy" ? "buy" : body.order_type === "sell" ? "sell" : null;
  const amountShares = typeof body.amount_shares === "number" ? body.amount_shares : parseInt(String(body.amount_shares), 10);
  const pricePerShare = body.price_per_share_usdc?.trim();

  if (!wallet?.startsWith("0x") || !orderType || !amountShares || amountShares < 1 || !pricePerShare) {
    return NextResponse.json({ error: "wallet, order_type (sell|buy), amount_shares (>0), price_per_share_usdc required" }, { status: 400 });
  }

  const video = await prisma.video.findUnique({
    where: { id: videoId },
    include: { quotation: true, share_holdings: true },
  });
  if (!video) return NextResponse.json({ error: "Video not found" }, { status: 404 });

  if (orderType === "sell") {
    const holding = await prisma.videoShareHolding.findUnique({
      where: { video_id_owner_wallet: { video_id: videoId, owner_wallet: wallet } },
    });
    if (!holding || holding.shares < amountShares) {
      return NextResponse.json({ error: "Insufficient shares to sell" }, { status: 400 });
    }
    // Cria ordem de venda (as shares continuam com o vendedor até alguém preencher)
    const order = await prisma.videoShareOrder.create({
      data: {
        video_id: videoId,
        order_type: "sell",
        wallet,
        amount_shares: amountShares,
        price_per_share_usdc: pricePerShare,
        status: "active",
      },
    });
    return NextResponse.json(order);
  }

  // orderType === "buy" — ordem de compra (outro vendedor pode preencher depois, ou compra do pool inicial)
  const order = await prisma.videoShareOrder.create({
    data: {
      video_id: videoId,
      order_type: "buy",
      wallet,
      amount_shares: amountShares,
      price_per_share_usdc: pricePerShare,
      status: "active",
    },
  });
  return NextResponse.json(order);
}

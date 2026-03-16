import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { debitInTx, creditInTx } from "@/lib/credits";
import type { PrismaClient } from "@prisma/client";

type PrismaTx = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

/**
 * POST .../fill — preencher ordem de venda: comprador paga em créditos, vendedor recebe créditos.
 * Body: { buyer_wallet, amount_shares? }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; orderId: string }> }
) {
  const prisma = getPrisma();
  if (!prisma) return NextResponse.json({ error: "Prisma not configured" }, { status: 503 });
  const { id: videoId, orderId } = await params;
  const body = (await request.json()) as { buyer_wallet?: string; amount_shares?: number };

  const buyerWallet = body.buyer_wallet?.trim().toLowerCase();
  if (!buyerWallet?.startsWith("0x")) {
    return NextResponse.json({ error: "buyer_wallet required" }, { status: 400 });
  }

  const order = await prisma.videoShareOrder.findFirst({
    where: { id: orderId, video_id: videoId, status: "active", order_type: "sell" },
  });
  if (!order) return NextResponse.json({ error: "Order not found or not fillable" }, { status: 404 });

  const fillAmount = body.amount_shares != null ? Math.min(order.amount_shares, Math.max(1, body.amount_shares)) : order.amount_shares;
  const sellerWallet = order.wallet.toLowerCase();
  const pricePerShare = parseFloat(order.price_per_share_usdc) || 0;
  const totalCredits = (pricePerShare * fillAmount).toFixed(2);

  const sellerHolding = await prisma.videoShareHolding.findUnique({
    where: { video_id_owner_wallet: { video_id: videoId, owner_wallet: sellerWallet } },
  });
  if (!sellerHolding || sellerHolding.shares < fillAmount) {
    return NextResponse.json({ error: "Seller no longer has enough shares" }, { status: 400 });
  }

  const result = await prisma.$transaction(async (tx) => {
    const debitResult = await debitInTx(
      tx as PrismaTx,
      buyerWallet,
      totalCredits,
      "share_buy",
      "video_share_order",
      orderId
    );
    if (!debitResult.ok) return { ok: false as const, error: debitResult.error };

    await creditInTx(
      tx as PrismaTx,
      sellerWallet,
      totalCredits,
      "share_sell",
      "video_share_order",
      orderId
    );

    if (sellerHolding.shares === fillAmount) {
      await tx.videoShareHolding.delete({
        where: { video_id_owner_wallet: { video_id: videoId, owner_wallet: sellerWallet } },
      });
    } else {
      await tx.videoShareHolding.update({
        where: { video_id_owner_wallet: { video_id: videoId, owner_wallet: sellerWallet } },
        data: { shares: sellerHolding.shares - fillAmount },
      });
    }
    const buyerHolding = await tx.videoShareHolding.findUnique({
      where: { video_id_owner_wallet: { video_id: videoId, owner_wallet: buyerWallet } },
    });
    if (buyerHolding) {
      await tx.videoShareHolding.update({
        where: { video_id_owner_wallet: { video_id: videoId, owner_wallet: buyerWallet } },
        data: { shares: buyerHolding.shares + fillAmount },
      });
    } else {
      await tx.videoShareHolding.create({
        data: { video_id: videoId, owner_wallet: buyerWallet, shares: fillAmount },
      });
    }
    const newOrderAmount = order.amount_shares - fillAmount;
    if (newOrderAmount <= 0) {
      await tx.videoShareOrder.update({
        where: { id: orderId },
        data: { status: "filled", filled_at: new Date(), counterparty_wallet: buyerWallet },
      });
    } else {
      await tx.videoShareOrder.update({
        where: { id: orderId },
        data: { amount_shares: newOrderAmount },
      });
    }
    return { ok: true as const, filled_shares: fillAmount };
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error, code: "insufficient_credits" }, { status: 400 });
  }
  return NextResponse.json({ ok: true, filled_shares: result.filled_shares });
}

/**
 * PATCH .../cancel — cancelar ordem ativa.
 * Query: ?wallet=0x... (quem está cancelando deve ser o dono da ordem)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; orderId: string }> }
) {
  const prisma = getPrisma();
  if (!prisma) return NextResponse.json({ error: "Prisma not configured" }, { status: 503 });
  const { id: videoId, orderId } = await params;
  const wallet = request.nextUrl.searchParams.get("wallet")?.toLowerCase();

  if (!wallet) return NextResponse.json({ error: "wallet required" }, { status: 400 });

  const order = await prisma.videoShareOrder.findFirst({
    where: { id: orderId, video_id: videoId, status: "active" },
  });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.wallet.toLowerCase() !== wallet) return NextResponse.json({ error: "Not order owner" }, { status: 403 });

  await prisma.videoShareOrder.update({
    where: { id: orderId },
    data: { status: "cancelled" },
  });
  return NextResponse.json({ ok: true });
}

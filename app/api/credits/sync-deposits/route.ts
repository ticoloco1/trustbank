import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { credit } from "@/lib/credits";
import { findDepositsToPlatform, verifyUsdcPayment } from "@/lib/verify-payment";

/**
 * POST /api/credits/sync-deposits — descobre depósitos USDC enviados à plataforma e credita automaticamente.
 * Body: { wallet: "0x..." }
 * Varre as redes configuradas (Polygon, Ethereum) e credita qualquer tx ainda não creditada.
 */
export async function POST(request: NextRequest) {
  const prisma = getPrisma();
  if (!prisma) return NextResponse.json({ error: "Prisma not configured" }, { status: 503 });
  const body = (await request.json()) as { wallet?: string };
  const wallet = body.wallet?.trim().toLowerCase();
  if (!wallet?.startsWith("0x")) {
    return NextResponse.json({ error: "wallet required" }, { status: 400 });
  }

  const deposits = await findDepositsToPlatform(wallet);
  const credited: { txHash: string; amount: string }[] = [];
  const skipped: string[] = [];

  for (const d of deposits) {
    const existing = await prisma.creditTransaction.findFirst({
      where: { tx_hash: d.txHash, type: "deposit" },
    });
    if (existing) {
      skipped.push(d.txHash);
      continue;
    }
    const verified = await verifyUsdcPayment({
      txHash: d.txHash,
      minAmountUsdc: 0.01,
    });
    if (!verified.success || verified.from.toLowerCase() !== wallet) continue;
    await credit(prisma, wallet, verified.amount, "deposit", "deposit_tx", d.txHash, d.txHash);
    credited.push({ txHash: d.txHash, amount: verified.amount });
  }

  const balanceRow = await prisma.creditBalance.findUnique({ where: { wallet } });
  return NextResponse.json({
    ok: true,
    credited: credited.length,
    credited_txs: credited,
    skipped: skipped.length,
    balance_usdc: balanceRow?.balance_usdc ?? "0",
  });
}

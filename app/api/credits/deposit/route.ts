import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { credit } from "@/lib/credits";
import { verifyUsdcPayment } from "@/lib/verify-payment";

/**
 * POST /api/credits/deposit — depositar USDC (enviar para a carteira da plataforma) e receber créditos 1:1.
 * Body: { wallet: "0x...", tx_hash: "0x..." }
 * Verifica se a tx enviou USDC para a platform wallet e credita o saldo. Cada tx_hash só credita uma vez.
 */
export async function POST(request: NextRequest) {
  const prisma = getPrisma();
  if (!prisma) return NextResponse.json({ error: "Prisma not configured" }, { status: 503 });
  const body = (await request.json()) as { wallet?: string; tx_hash?: string };
  const wallet = body.wallet?.trim().toLowerCase();
  const txHash = body.tx_hash?.trim();
  if (!wallet?.startsWith("0x") || !txHash?.startsWith("0x")) {
    return NextResponse.json({ error: "wallet and tx_hash required" }, { status: 400 });
  }

  const existing = await prisma.creditTransaction.findFirst({
    where: { tx_hash: txHash, type: "deposit" },
  });
  if (existing) {
    return NextResponse.json({ error: "This deposit was already credited", balance_usdc: existing.balance_after }, { status: 409 });
  }

  const verified = await verifyUsdcPayment({
    txHash,
    minAmountUsdc: 0.01,
  });
  if (!verified.success) {
    return NextResponse.json({ error: verified.error }, { status: 400 });
  }
  if (verified.from.toLowerCase() !== wallet) {
    return NextResponse.json({ error: "Transaction sender does not match wallet" }, { status: 400 });
  }

  const amount = verified.amount;
  await credit(prisma, wallet, amount, "deposit", "deposit_tx", txHash, txHash);
  const row = await prisma.creditBalance.findUnique({ where: { wallet } });
  return NextResponse.json({
    ok: true,
    amount_usdc: amount,
    balance_usdc: row?.balance_usdc ?? amount,
    message: "Credits added. 1 credit = 1 USDC.",
  });
}

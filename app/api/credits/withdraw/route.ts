import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { debit, credit } from "@/lib/credits";
import { sendUsdcTo } from "@/lib/send-usdc";

/**
 * POST /api/credits/withdraw — retirada automática: debita créditos e envia USDC à carteira (Polygon).
 * Body: { wallet: "0x...", amount_usdc: "10.00" }
 * Requer PLATFORM_WALLET_PRIVATE_KEY e POLYGON_RPC_URL para envio automático.
 */
export async function POST(request: NextRequest) {
  const prisma = getPrisma();
  if (!prisma) return NextResponse.json({ error: "Prisma not configured" }, { status: 503 });
  const body = (await request.json()) as { wallet?: string; amount_usdc?: string };
  const wallet = body.wallet?.trim().toLowerCase();
  const amountUsdc = body.amount_usdc?.trim();
  if (!wallet?.startsWith("0x") || !amountUsdc) {
    return NextResponse.json({ error: "wallet and amount_usdc required" }, { status: 400 });
  }
  const amount = parseFloat(amountUsdc);
  if (Number.isNaN(amount) || amount < 0.01) {
    return NextResponse.json({ error: "amount_usdc must be at least 0.01" }, { status: 400 });
  }

  const result = await debit(prisma, wallet, amountUsdc, "withdrawal", "withdrawal", undefined);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const send = await sendUsdcTo(wallet, amountUsdc);
  if (!send.success) {
    await credit(prisma, wallet, amountUsdc, "deposit", "withdrawal_refund", undefined);
    return NextResponse.json({
      error: send.error,
      message: "Debit was reverted. Configure PLATFORM_WALLET_PRIVATE_KEY and POLYGON_RPC_URL for automatic withdrawals.",
    }, { status: 502 });
  }

  const lastWithdrawal = await prisma.creditTransaction.findFirst({
    where: { wallet, type: "withdrawal" },
    orderBy: { created_at: "desc" },
  });
  if (lastWithdrawal) {
    await prisma.creditTransaction.update({
      where: { id: lastWithdrawal.id },
      data: { tx_hash: send.txHash },
    });
  }

  return NextResponse.json({
    ok: true,
    amount_usdc: amountUsdc,
    balance_after: result.balance_after,
    tx_hash: send.txHash,
    chain: send.chain,
    message: "USDC sent to your wallet on Polygon.",
  });
}

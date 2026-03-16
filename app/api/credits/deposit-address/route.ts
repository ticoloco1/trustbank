import { NextResponse } from "next/server";
import { getPlatformWallet } from "@/lib/payment-config";

/**
 * GET /api/credits/deposit-address — endereço para enviar USDC e receber créditos (1:1).
 */
export async function GET() {
  const address = getPlatformWallet();
  if (!address) return NextResponse.json({ error: "Deposit not configured" }, { status: 503 });
  return NextResponse.json({ address });
}

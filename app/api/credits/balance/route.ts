import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { getBalance } from "@/lib/credits";

/**
 * GET /api/credits/balance?wallet=0x...
 */
export async function GET(request: NextRequest) {
  const prisma = getPrisma();
  if (!prisma) return NextResponse.json({ error: "Prisma not configured" }, { status: 503 });
  const wallet = request.nextUrl.searchParams.get("wallet")?.trim().toLowerCase();
  if (!wallet?.startsWith("0x")) {
    return NextResponse.json({ error: "wallet required" }, { status: 400 });
  }
  const balance = await getBalance(prisma, wallet);
  return NextResponse.json({ wallet, balance_usdc: balance });
}

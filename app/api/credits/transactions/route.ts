import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

/**
 * GET /api/credits/transactions?wallet=0x...&limit=50
 */
export async function GET(request: NextRequest) {
  const prisma = getPrisma();
  if (!prisma) return NextResponse.json({ error: "Prisma not configured" }, { status: 503 });
  const wallet = request.nextUrl.searchParams.get("wallet")?.trim().toLowerCase();
  const limit = Math.min(100, parseInt(request.nextUrl.searchParams.get("limit") ?? "50", 10) || 50);
  if (!wallet?.startsWith("0x")) {
    return NextResponse.json({ error: "wallet required" }, { status: 400 });
  }
  const list = await prisma.creditTransaction.findMany({
    where: { wallet },
    orderBy: { created_at: "desc" },
    take: limit,
  });
  return NextResponse.json(list);
}

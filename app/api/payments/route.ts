import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

/**
 * GET /api/payments — lista pagamentos.
 * Query: ?wallet=0x... (filtrar por payer), ?type=VIDEO_UNLOCK|..., ?limit=50
 */
export async function GET(request: NextRequest) {
  const prisma = getPrisma();
  if (!prisma) return NextResponse.json({ error: "Prisma not configured" }, { status: 503 });

  const wallet = request.nextUrl.searchParams.get("wallet")?.toLowerCase();
  const type = request.nextUrl.searchParams.get("type");
  const limit = Math.min(parseInt(request.nextUrl.searchParams.get("limit") || "50", 10) || 50, 100);

  const where: { payer_wallet?: string; type?: string } = {};
  if (wallet) where.payer_wallet = wallet;
  if (type) where.type = type;

  const payments = await prisma.payment.findMany({
    where,
    orderBy: { created_at: "desc" },
    take: limit,
    select: {
      id: true,
      type: true,
      amount_usdc: true,
      payer_wallet: true,
      tx_hash: true,
      reference_type: true,
      reference_id: true,
      status: true,
      verified_at: true,
      created_at: true,
    },
  });
  return NextResponse.json(payments);
}

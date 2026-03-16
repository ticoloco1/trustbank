import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

async function isAdmin(wallet: string | null): Promise<boolean> {
  if (!wallet?.startsWith("0x")) return false;
  const w = wallet.toLowerCase();
  const envAdmin = process.env.ADMIN_WALLET ?? process.env.ADMIN_WALLETS;
  if (envAdmin) {
    const list = envAdmin.split(",").map((s) => s.trim().toLowerCase());
    if (list.includes(w)) return true;
  }
  const prisma = getPrisma();
  if (!prisma) return false;
  const row = await prisma.adminWalletAddress.findUnique({
    where: { wallet_address: w },
  });
  return !!row;
}

/**
 * PATCH /api/videos/[id]/quotation — cria ou atualiza cotação (lançar vídeo com shares).
 * Apenas admin pode criar/editar cotação.
 * Body: { admin_wallet: "0x...", total_shares?, system_percent?, sellable_percent?, valuation_usdc?, ticker_symbol?, revenue_usdc? }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const prisma = getPrisma();
  if (!prisma) return NextResponse.json({ error: "Prisma not configured" }, { status: 503 });
  const { id: videoId } = await params;
  const video = await prisma.video.findUnique({ where: { id: videoId } });
  if (!video) return NextResponse.json({ error: "Video not found" }, { status: 404 });

  const body = (await request.json()) as {
    admin_wallet?: string;
    total_shares?: number;
    system_percent?: number;
    sellable_percent?: number;
    valuation_usdc?: string;
    ticker_symbol?: string;
    revenue_usdc?: string;
  };

  const adminWallet = body.admin_wallet?.trim().toLowerCase();
  if (!adminWallet?.startsWith("0x")) {
    return NextResponse.json({ error: "admin_wallet required to create or update quotation" }, { status: 400 });
  }
  if (!(await isAdmin(adminWallet))) {
    return NextResponse.json({ error: "Only admin can launch or edit video shares (quotation)" }, { status: 403 });
  }

  const data: {
    total_shares?: number;
    system_percent?: number;
    sellable_percent?: number;
    valuation_usdc?: string;
    ticker_symbol?: string;
    revenue_usdc?: string;
  } = {};
  if (body.total_shares !== undefined) data.total_shares = body.total_shares;
  if (body.system_percent !== undefined) data.system_percent = Math.min(100, Math.max(0, body.system_percent));
  if (body.sellable_percent !== undefined) data.sellable_percent = Math.min(80, Math.max(50, body.sellable_percent));
  if (body.valuation_usdc !== undefined) data.valuation_usdc = body.valuation_usdc;
  if (body.ticker_symbol !== undefined) data.ticker_symbol = body.ticker_symbol;
  if (body.revenue_usdc !== undefined) data.revenue_usdc = body.revenue_usdc;

  const quotation = await prisma.videoQuotation.upsert({
    where: { video_id: videoId },
    create: { video_id: videoId, ...data },
    update: data,
  });
  return NextResponse.json(quotation);
}

/**
 * GET /api/videos/[id]/quotation
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const prisma = getPrisma();
  if (!prisma) return NextResponse.json({ error: "Prisma not configured" }, { status: 503 });
  const { id: videoId } = await params;
  const q = await prisma.videoQuotation.findUnique({ where: { video_id: videoId } });
  return NextResponse.json(q ?? null);
}

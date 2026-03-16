import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

/**
 * GET /api/videos/[id] — vídeo público por id (uuid) ou youtube_id.
 * Query: ?wallet=0x... para incluir hasAccess no payload (paywall).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const prisma = getPrisma();
  if (!prisma) return NextResponse.json({ error: "Prisma not configured" }, { status: 503 });
  const { id } = await params;
  const wallet = request.nextUrl.searchParams.get("wallet")?.toLowerCase();
  const email = request.nextUrl.searchParams.get("email")?.toLowerCase();
  const viewerId = wallet || (email ? `email:${email}` : null);

  const video = await prisma.video.findFirst({
    where: {
      OR: [{ id: id }, { youtube_id: id }],
    },
    select: {
      id: true,
      youtube_id: true,
      title: true,
      thumbnail_url: true,
      paywall_enabled: true,
      paywall_price_usdc: true,
      delisted_at: true,
    },
  });

  if (!video) return NextResponse.json(null, { status: 404 });

  const out: Record<string, unknown> = { ...video };

  if (viewerId && video.paywall_enabled) {
    const unlock = await prisma.videoUnlock.findUnique({
      where: {
        video_id_viewer_id: { video_id: video.id, viewer_id: viewerId },
      },
    });
    (out as Record<string, unknown>).hasAccess = !!unlock;
  } else if (video.paywall_enabled) {
    (out as Record<string, unknown>).hasAccess = false;
  }

  return NextResponse.json(out);
}

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
 * PATCH /api/videos/[id] — admin: marcar vídeo como removido do ar (delisted).
 * Body: { admin_wallet: "0x...", delisted_at: true | false }
 * Quando true, define delisted_at = now(); quando false, limpa (vídeo voltou).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const prisma = getPrisma();
  if (!prisma) return NextResponse.json({ error: "Prisma not configured" }, { status: 503 });
  const { id } = await params;
  const body = (await request.json()) as { admin_wallet?: string; delisted_at?: boolean };
  const adminWallet = body.admin_wallet?.trim().toLowerCase();
  if (!adminWallet?.startsWith("0x")) {
    return NextResponse.json({ error: "admin_wallet required" }, { status: 400 });
  }
  if (!(await isAdmin(adminWallet))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const video = await prisma.video.findUnique({ where: { id } });
  if (!video) return NextResponse.json({ error: "Video not found" }, { status: 404 });

  const delistedAt = body.delisted_at === true ? new Date() : body.delisted_at === false ? null : undefined;
  if (delistedAt === undefined) {
    return NextResponse.json({ error: "delisted_at (true | false) required" }, { status: 400 });
  }

  await prisma.video.update({
    where: { id },
    data: { delisted_at: delistedAt },
  });
  return NextResponse.json({ ok: true, delisted_at: delistedAt });
}

import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

const REQUIRE_PAYWALL_TX = process.env.REQUIRE_PAYWALL_TX === "true" || process.env.REQUIRE_PAYWALL_TX === "1";

/**
 * POST /api/paywall/unlock — registra desbloqueio (após pagamento USDC confirmado).
 * Body: { video_id: string, viewer_wallet: string, tx_hash?: string, amount_usdc?: string }
 * Se REQUIRE_PAYWALL_TX=true: exige tx_hash (e em produção validar na chain que a tx enviou USDC à carteira da plataforma).
 */
export async function POST(request: NextRequest) {
  const prisma = getPrisma();
  if (!prisma) return NextResponse.json({ error: "Prisma not configured" }, { status: 503 });

  try {
    const body = (await request.json()) as {
      video_id?: string;
      viewer_wallet?: string;
      tx_hash?: string;
      amount_usdc?: string;
    };
    const { video_id, viewer_wallet, tx_hash, amount_usdc } = body;
    if (!video_id || !viewer_wallet) {
      return NextResponse.json(
        { error: "missing_params", message: "video_id e viewer_wallet são obrigatórios." },
        { status: 400 }
      );
    }
    if (REQUIRE_PAYWALL_TX && (!tx_hash || !tx_hash.trim())) {
      return NextResponse.json(
        { error: "tx_required", message: "Pagamento em blockchain obrigatório. Envie o tx_hash da transação USDC." },
        { status: 400 }
      );
    }

    const wallet = viewer_wallet.toLowerCase();
    const video = await prisma.video.findUnique({
      where: { id: video_id },
      select: { id: true, paywall_enabled: true, paywall_price_usdc: true },
    });
    if (!video) {
      return NextResponse.json({ error: "video_not_found", message: "Vídeo não encontrado." }, { status: 404 });
    }
    if (!video.paywall_enabled) {
      return NextResponse.json({ error: "no_paywall", message: "Este vídeo não tem paywall." }, { status: 400 });
    }

    const existing = await prisma.videoUnlock.findUnique({
      where: { video_id_viewer_id: { video_id: video_id, viewer_id: wallet } },
    });
    if (existing) {
      return NextResponse.json(existing);
    }

    const unlock = await prisma.videoUnlock.create({
      data: {
        video_id,
        viewer_id: wallet,
        viewer_wallet: wallet,
        tx_hash: tx_hash ?? null,
        amount_usdc: amount_usdc ?? video.paywall_price_usdc ?? null,
      },
    });
    return NextResponse.json(unlock);
  } catch (e) {
    console.error("[api/paywall/unlock]", e);
    return NextResponse.json(
      { error: "server_error", message: "Erro ao registrar desbloqueio." },
      { status: 500 }
    );
  }
}

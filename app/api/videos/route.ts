import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { getSessionFromCookie } from "@/lib/auth";
import { getYouTubeIdFromUrl } from "@/lib/youtube";
import { getVideoChannelId } from "@/lib/youtube";

/**
 * POST /api/videos — adiciona vídeo (login próprio ou wallet).
 * Validação por backlink: criador coloca o link na descrição do vídeo.
 * Body: { youtubeUrl: string, paywallEnabled?: boolean, paywallPriceUsdc?: string, wallet?: string }
 * - Se houver sessão (cookie tb_session), usa o User para identificar o Creator.
 * - Se não houver sessão mas wallet for enviado, usa a carteira como Creator (payout_wallet).
 */
export async function POST(request: NextRequest) {
  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json({ error: "Prisma not configured" }, { status: 503 });
  }

  try {
    const body = (await request.json()) as {
      youtubeUrl?: string;
      paywallEnabled?: boolean;
      paywallPriceUsdc?: string;
      wallet?: string;
    };
    const { youtubeUrl, paywallEnabled = false, paywallPriceUsdc, wallet } = body;

    const cookieHeader = request.headers.get("cookie") ?? undefined;
    const session = getSessionFromCookie(cookieHeader);
    const walletLower = typeof wallet === "string" ? wallet.trim().toLowerCase() : null;
    if (!walletLower && !session) {
      return NextResponse.json(
        { error: "missing_auth", message: "Faça login (e-mail/senha) ou conecte a carteira para adicionar vídeos." },
        { status: 401 }
      );
    }

    if (!youtubeUrl) {
      return NextResponse.json(
        { error: "missing_params", message: "youtubeUrl é obrigatório." },
        { status: 400 }
      );
    }

    const youtubeId = getYouTubeIdFromUrl(youtubeUrl);
    if (!youtubeId) {
      return NextResponse.json({ error: "invalid_url", message: "URL do YouTube inválida." }, { status: 400 });
    }

    // Metadados do vídeo via API pública (sem OAuth). Validação é por backlink.
    const videoMeta = await getVideoChannelId(youtubeId);
    if (!videoMeta) {
      return NextResponse.json(
        { error: "video_not_found", message: "Vídeo não encontrado ou API do YouTube indisponível." },
        { status: 400 }
      );
    }

    let creator = null;
    if (session) {
      const user = await prisma.user.findUnique({ where: { id: session.userId } });
      if (user) {
        creator = await prisma.creator.findFirst({ where: { user_id: user.id } });
        if (!creator) {
          creator = await prisma.creator.create({
            data: {
              user_id: user.id,
              email: user.email,
              payout_wallet: walletLower || undefined,
            },
          });
        } else if (walletLower && !creator.payout_wallet) {
          creator = await prisma.creator.update({
            where: { id: creator.id },
            data: { payout_wallet: walletLower },
          });
        }
      }
    }
    if (!creator && walletLower) {
      creator = await prisma.creator.findFirst({ where: { payout_wallet: walletLower } });
      if (!creator) {
        creator = await prisma.creator.create({
          data: { payout_wallet: walletLower, email: null },
        });
      }
    }

    if (!creator) {
      return NextResponse.json(
        { error: "creator_failed", message: "Não foi possível identificar o criador." },
        { status: 403 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const backlinkUrl = `${baseUrl}/v/${youtubeId}`;

    const existing = await prisma.video.findUnique({ where: { youtube_id: youtubeId } });
    if (existing) {
      const updated = await prisma.video.update({
        where: { id: existing.id },
        data: {
          title: videoMeta.title,
          thumbnail_url: videoMeta.thumbnailUrl,
          channel_id: videoMeta.channelId,
          paywall_enabled: paywallEnabled,
          paywall_price_usdc: paywallPriceUsdc ?? null,
          backlink_url: backlinkUrl,
        },
      });
      return NextResponse.json(updated);
    }

    const video = await prisma.video.create({
      data: {
        creator_id: creator.id,
        youtube_id: youtubeId,
        channel_id: videoMeta.channelId,
        title: videoMeta.title,
        thumbnail_url: videoMeta.thumbnailUrl,
        paywall_enabled: paywallEnabled,
        paywall_price_usdc: paywallPriceUsdc ?? null,
        backlink_verified: false,
        backlink_url: backlinkUrl,
      },
    });
    return NextResponse.json(video);
  } catch (e) {
    console.error("[api/videos]", e);
    return NextResponse.json({ error: "server_error", message: "Erro ao adicionar vídeo." }, { status: 500 });
  }
}

/**
 * GET /api/videos — lista vídeos do criador.
 * Query: ?creatorId=xxx ou sessão (cookie) ou wallet (query).
 */
export async function GET(request: NextRequest) {
  const prisma = getPrisma();
  if (!prisma) return NextResponse.json({ error: "Prisma not configured" }, { status: 503 });

  const creatorId = request.nextUrl.searchParams.get("creatorId");
  const wallet = request.nextUrl.searchParams.get("wallet")?.toLowerCase();

  if (creatorId) {
    const videos = await prisma.video.findMany({
      where: { creator_id: creatorId },
      orderBy: { created_at: "desc" },
    });
    return NextResponse.json(videos);
  }

  const cookieHeader = request.headers.get("cookie") ?? undefined;
  const session = getSessionFromCookie(cookieHeader);

  if (session) {
    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (user) {
      const creator = await prisma.creator.findFirst({ where: { user_id: user.id } });
      if (creator) {
        const videos = await prisma.video.findMany({
          where: { creator_id: creator.id },
          orderBy: { created_at: "desc" },
        });
        return NextResponse.json(videos);
      }
    }
  }

  if (wallet && wallet.startsWith("0x")) {
    const creator = await prisma.creator.findFirst({ where: { payout_wallet: wallet } });
    if (creator) {
      const videos = await prisma.video.findMany({
        where: { creator_id: creator.id },
        orderBy: { created_at: "desc" },
      });
      return NextResponse.json(videos);
    }
  }

  return NextResponse.json([]);
}

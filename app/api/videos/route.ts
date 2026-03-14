import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { verifyVideoOwnership, getGoogleUserInfo, getUserChannelId, getYouTubeIdFromUrl } from "@/lib/youtube";

const COOKIE_NAME = "tb_google_token";

/**
 * POST /api/videos — adiciona vídeo ao painel só se for dono (verificação YouTube).
 * Body: { youtubeUrl: string, accessToken?: string, paywallEnabled?: boolean, paywallPriceUsdc?: string }
 * accessToken pode vir do body ou do cookie (login com Google no painel).
 */
export async function POST(request: NextRequest) {
  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json({ error: "Prisma not configured" }, { status: 503 });
  }

  try {
    const body = (await request.json()) as {
      youtubeUrl?: string;
      accessToken?: string;
      paywallEnabled?: boolean;
      paywallPriceUsdc?: string;
    };
    const { youtubeUrl, paywallEnabled = false, paywallPriceUsdc } = body;
    const accessToken = body.accessToken ?? request.cookies.get(COOKIE_NAME)?.value;
    if (!youtubeUrl || !accessToken) {
      return NextResponse.json(
        { error: "missing_params", message: "youtubeUrl é obrigatório. Entre com Google no painel para adicionar vídeos." },
        { status: 400 }
      );
    }

    const youtubeId = getYouTubeIdFromUrl(youtubeUrl);
    if (!youtubeId) {
      return NextResponse.json({ error: "invalid_url", message: "URL do YouTube inválida." }, { status: 400 });
    }

    const verified = await verifyVideoOwnership(youtubeId, accessToken);
    if (!verified) {
      return NextResponse.json(
        {
          error: "not_owner",
          message: "Você não é o dono deste vídeo. Só o dono pode adicionar ao painel e usar paywall.",
        },
        { status: 403 }
      );
    }

    const [userInfo, userChannelId] = await Promise.all([
      getGoogleUserInfo(accessToken),
      getUserChannelId(accessToken),
    ]);
    if (!userInfo || !userChannelId) {
      return NextResponse.json({ error: "invalid_token", message: "Token Google inválido ou sem permissão YouTube." }, { status: 403 });
    }

    let creator = await prisma.creator.findFirst({
      where: { OR: [{ google_id: userInfo.id }, { youtube_channel_id: userChannelId }] },
    });
    if (!creator) {
      creator = await prisma.creator.create({
        data: {
          google_id: userInfo.id,
          email: userInfo.email,
          youtube_channel_id: userChannelId,
        },
      });
    } else if (!creator.youtube_channel_id) {
      creator = await prisma.creator.update({
        where: { id: creator.id },
        data: { youtube_channel_id: userChannelId, email: creator.email ?? userInfo.email },
      });
    }

    const existing = await prisma.video.findUnique({ where: { youtube_id: youtubeId } });
    if (existing) {
      const updated = await prisma.video.update({
        where: { id: existing.id },
        data: {
          title: verified.title,
          thumbnail_url: verified.thumbnailUrl,
          paywall_enabled: paywallEnabled,
          paywall_price_usdc: paywallPriceUsdc ?? null,
        },
      });
      return NextResponse.json(updated);
    }

    const video = await prisma.video.create({
      data: {
        creator_id: creator.id,
        youtube_id: youtubeId,
        channel_id: verified.channelId,
        title: verified.title,
        thumbnail_url: verified.thumbnailUrl,
        paywall_enabled: paywallEnabled,
        paywall_price_usdc: paywallPriceUsdc ?? null,
      },
    });
    return NextResponse.json(video);
  } catch (e) {
    console.error("[api/videos]", e);
    return NextResponse.json({ error: "server_error", message: "Erro ao adicionar vídeo." }, { status: 500 });
  }
}

/** GET /api/videos — lista vídeos do criador (query: ?creatorId=xxx ou cookie tb_google_token) */
export async function GET(request: NextRequest) {
  const prisma = getPrisma();
  if (!prisma) return NextResponse.json({ error: "Prisma not configured" }, { status: 503 });

  const accessToken = request.nextUrl.searchParams.get("accessToken") ?? request.cookies.get(COOKIE_NAME)?.value;
  const creatorId = request.nextUrl.searchParams.get("creatorId");

  if (creatorId) {
    const videos = await prisma.video.findMany({
      where: { creator_id: creatorId },
      orderBy: { created_at: "desc" },
    });
    return NextResponse.json(videos);
  }

  if (accessToken) {
    const userInfo = await getGoogleUserInfo(accessToken);
    if (!userInfo) return NextResponse.json([], { status: 200 });
    const creator = await prisma.creator.findUnique({ where: { google_id: userInfo.id } });
    if (!creator) return NextResponse.json([], { status: 200 });
    const videos = await prisma.video.findMany({
      where: { creator_id: creator.id },
      orderBy: { created_at: "desc" },
    });
    return NextResponse.json(videos);
  }

  return NextResponse.json([], { status: 200 });
}

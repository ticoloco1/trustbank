import { NextRequest, NextResponse } from "next/server";
import { getYouTubeIdFromUrl, verifyVideoOwnership } from "@/lib/youtube";

/**
 * POST /api/youtube/verify-owner
 * Body: { youtubeUrl: string, accessToken: string }
 * Verifica se o usuário (token Google/YouTube) é dono do vídeo.
 * Só quem for dono pode usar paywall — caso contrário retorna erro.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { youtubeUrl?: string; accessToken?: string };
    const { youtubeUrl, accessToken } = body;
    if (!youtubeUrl || !accessToken) {
      return NextResponse.json(
        { ok: false, error: "missing_params", message: "youtubeUrl e accessToken são obrigatórios." },
        { status: 400 }
      );
    }

    const youtubeId = getYouTubeIdFromUrl(youtubeUrl);
    if (!youtubeId) {
      return NextResponse.json(
        { ok: false, error: "invalid_url", message: "URL do YouTube inválida." },
        { status: 400 }
      );
    }

    const verified = await verifyVideoOwnership(youtubeId, accessToken);
    if (!verified) {
      return NextResponse.json(
        {
          ok: false,
          error: "not_owner",
          message: "Você não é o dono deste vídeo. Só o dono pode usar paywall. Conecte com a conta Google do canal do vídeo.",
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      ok: true,
      youtubeId,
      channelId: verified.channelId,
      title: verified.title,
      thumbnailUrl: verified.thumbnailUrl,
    });
  } catch (e) {
    console.error("[youtube/verify-owner]", e);
    return NextResponse.json(
      { ok: false, error: "server_error", message: "Erro ao verificar vídeo." },
      { status: 500 }
    );
  }
}

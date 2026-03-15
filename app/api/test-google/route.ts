import { NextResponse } from "next/server";
import { getGoogleClientId, getGoogleClientSecret, getYoutubeApiKey } from "@/lib/google-keys";
import { getGoogleAuthUrl } from "@/lib/youtube";

export const dynamic = "force-dynamic";

/**
 * GET /api/test-google — testa se as 3 chaves Google/YouTube estão ok.
 * Não expõe os valores, só status e resultado de um teste real (YouTube API).
 */
export async function GET() {
  const clientId = await getGoogleClientId();
  const clientSecret = await getGoogleClientSecret();
  const youtubeKey = await getYoutubeApiKey();

  const checks: Record<string, { set: boolean; ok?: boolean; message?: string }> = {
    GOOGLE_CLIENT_ID: { set: !!clientId },
    GOOGLE_CLIENT_SECRET: { set: !!clientSecret },
    YOUTUBE_API_KEY: { set: !!youtubeKey },
  };

  // Teste 1: URL de login Google (OAuth)
  try {
    const authUrl = await getGoogleAuthUrl();
    checks.OAuth = {
      set: true,
      ok: !!authUrl && authUrl.includes("accounts.google.com"),
      message: authUrl ? "URL de login gerada com sucesso" : "Falha ao gerar URL (verifique Client ID e Secret)",
    };
  } catch (e) {
    checks.OAuth = {
      set: !!clientId && !!clientSecret,
      ok: false,
      message: e instanceof Error ? e.message : "Erro ao gerar URL OAuth",
    };
  }

  // Teste 2: YouTube Data API (vídeo público)
  if (youtubeKey) {
    try {
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=dQw4w9WgXcQ&key=${youtubeKey}`
      );
      const data = (await res.json()) as { items?: unknown[]; error?: { message?: string } };
      if (data.error) {
        checks.YouTube_API = {
          set: true,
          ok: false,
          message: data.error.message || "YouTube API retornou erro",
        };
      } else {
        checks.YouTube_API = {
          set: true,
          ok: Array.isArray(data.items) && data.items.length > 0,
          message: data.items?.length ? "YouTube API OK — vídeo encontrado" : "YouTube API respondeu mas sem dados",
        };
      }
    } catch (e) {
      checks.YouTube_API = {
        set: true,
        ok: false,
        message: e instanceof Error ? e.message : "Erro ao chamar YouTube API",
      };
    }
  } else {
    checks.YouTube_API = { set: false, ok: false, message: "YOUTUBE_API_KEY não configurada" };
  }

  const allOk =
    checks.GOOGLE_CLIENT_ID.set &&
    checks.GOOGLE_CLIENT_SECRET.set &&
    checks.YOUTUBE_API_KEY.set &&
    checks.OAuth?.ok &&
    checks.YouTube_API?.ok;

  return NextResponse.json({
    ok: allOk,
    message: allOk
      ? "Todas as chaves configuradas e testes passaram."
      : "Verifique as chaves no .env.local ou no painel admin.",
    checks,
    source: "Banco (admin) ou .env.local",
  });
}

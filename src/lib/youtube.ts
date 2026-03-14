/**
 * Verificação de dono do vídeo no YouTube — obrigatória para liberar paywall.
 * Usa YouTube Data API v3: compara channelId do vídeo com o canal do usuário (OAuth).
 */
import { google } from "googleapis";

type YouTubeVideosResponse = {
  items?: Array<{
    snippet?: {
      channelId?: string;
      title?: string;
      thumbnails?: { high?: { url?: string }; maxres?: { url?: string } };
    };
  }>;
};

export function getYouTubeIdFromUrl(url: string): string | null {
  const m = url.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

export function getThumbnail(youtubeId: string, quality: "max" | "hq" = "max"): string {
  const q = quality === "max" ? "maxresdefault" : "hqdefault";
  return `https://img.youtube.com/vi/${youtubeId}/${q}.jpg`;
}

/** OAuth2 client para Google/YouTube (variáveis: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, NEXT_PUBLIC_APP_URL) */
function getOAuthClient(redirectUri?: string) {
  const redirect = redirectUri ?? (process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
    : "http://localhost:3000/api/auth/google/callback");
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirect
  );
}

/** URL para redirecionar o usuário ao login Google (escopo YouTube). */
export function getGoogleAuthUrl(redirectUri?: string): string | null {
  const client = getOAuthClient(redirectUri);
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) return null;
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/youtube.readonly",
    ],
  });
}

/** Troca o code (callback) por tokens. Retorna access_token e opcionalmente refresh_token. */
export async function exchangeCodeForTokens(code: string, redirectUri?: string): Promise<{ access_token: string; refresh_token?: string; expiry_date?: number } | null> {
  const client = getOAuthClient(redirectUri);
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) return null;
  const { tokens } = await client.getToken(code);
  return tokens.access_token
    ? { access_token: tokens.access_token, refresh_token: tokens.refresh_token ?? undefined, expiry_date: tokens.expiry_date ?? undefined }
    : null;
}

/**
 * Retorna o channelId do vídeo (YouTube Data API com API key).
 * Variável: YOUTUBE_API_KEY ou GOOGLE_API_KEY
 */
export async function getVideoChannelId(youtubeId: string): Promise<{ channelId: string; title: string; thumbnailUrl: string } | null> {
  const key = process.env.YOUTUBE_API_KEY || process.env.GOOGLE_API_KEY;
  if (!key) return null;
  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${youtubeId}&key=${key}`
  );
  const data = (await res.json()) as YouTubeVideosResponse;
  const item = data.items?.[0];
  const channelId = item?.snippet?.channelId;
  if (!channelId) return null;
  const thumb = item.snippet?.thumbnails?.maxres?.url ?? item.snippet?.thumbnails?.high?.url ?? getThumbnail(youtubeId);
  return {
    channelId,
    title: item.snippet?.title ?? "",
    thumbnailUrl: thumb,
  };
}

/**
 * Retorna o channelId do canal do usuário (OAuth com access_token).
 * Escopo necessário: youtube.readonly
 */
export async function getUserChannelId(accessToken: string): Promise<string | null> {
  const client = getOAuthClient();
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) return null;
  client.setCredentials({ access_token: accessToken });
  const yt = google.youtube({ version: "v3", auth: client });
  const res = await yt.channels.list({
    part: ["id"],
    mine: true,
    maxResults: 1,
  });
  const channelId = res.data.items?.[0]?.id ?? null;
  return channelId;
}

/**
 * Verifica se o usuário (accessToken) é dono do vídeo (youtubeId).
 * Retorna dados do vídeo se for dono; null se não for ou erro.
 */
export async function verifyVideoOwnership(
  youtubeId: string,
  accessToken: string
): Promise<{ channelId: string; title: string; thumbnailUrl: string } | null> {
  const [videoInfo, userChannelId] = await Promise.all([
    getVideoChannelId(youtubeId),
    getUserChannelId(accessToken),
  ]);
  if (!videoInfo || !userChannelId) return null;
  if (videoInfo.channelId !== userChannelId) return null;
  return videoInfo;
}

/** Dados do usuário Google (para criar/identificar Creator) */
export async function getGoogleUserInfo(accessToken: string): Promise<{ id: string; email: string | null } | null> {
  const client = getOAuthClient();
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) return null;
  client.setCredentials({ access_token: accessToken });
  const oauth2 = google.oauth2({ version: "v2", auth: client });
  const { data } = await oauth2.userinfo.get();
  return data?.id && data?.email ? { id: data.id, email: data.email } : data?.id ? { id: data.id, email: null } : null;
}

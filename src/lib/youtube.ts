/**
 * Verificação de dono do vídeo no YouTube — obrigatória para liberar paywall.
 * Usa YouTube Data API v3. Chaves vêm do painel admin (DB) ou env.
 */
import { google } from "googleapis";
import { getGoogleOAuthKeys, getYoutubeApiKey } from "./google-keys";

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

function getRedirectUri(redirectUri?: string): string {
  return redirectUri ?? (process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
    : "http://localhost:3000/api/auth/google/callback");
}

/** OAuth2 client (lê chaves do painel admin ou env). */
async function getOAuthClient(redirectUri?: string) {
  const keys = await getGoogleOAuthKeys();
  if (!keys) return null;
  const redirect = getRedirectUri(redirectUri);
  return new google.auth.OAuth2(keys.clientId, keys.clientSecret, redirect);
}

/** URL para redirecionar o usuário ao login Google (escopo YouTube). */
export async function getGoogleAuthUrl(redirectUri?: string): Promise<string | null> {
  const client = await getOAuthClient(redirectUri);
  if (!client) return null;
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

/** Troca o code (callback) por tokens. */
export async function exchangeCodeForTokens(code: string, redirectUri?: string): Promise<{ access_token: string; refresh_token?: string; expiry_date?: number } | null> {
  const client = await getOAuthClient(redirectUri);
  if (!client) return null;
  const { tokens } = await client.getToken(code);
  return tokens.access_token
    ? { access_token: tokens.access_token, refresh_token: tokens.refresh_token ?? undefined, expiry_date: tokens.expiry_date ?? undefined }
    : null;
}

/** Retorna o channelId do vídeo (YouTube Data API). Chave do painel admin ou env. */
export async function getVideoChannelId(youtubeId: string): Promise<{ channelId: string; title: string; thumbnailUrl: string } | null> {
  const key = await getYoutubeApiKey();
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

/** Retorna o channelId do canal do usuário (OAuth). */
export async function getUserChannelId(accessToken: string): Promise<string | null> {
  const client = await getOAuthClient();
  if (!client) return null;
  client.setCredentials({ access_token: accessToken });
  const yt = google.youtube({ version: "v3", auth: client });
  const res = await yt.channels.list({
    part: ["id"],
    mine: true,
    maxResults: 1,
  });
  return res.data.items?.[0]?.id ?? null;
}

/** Verifica se o usuário é dono do vídeo. */
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

/** Dados do usuário Google. */
export async function getGoogleUserInfo(accessToken: string): Promise<{ id: string; email: string | null } | null> {
  const client = await getOAuthClient();
  if (!client) return null;
  client.setCredentials({ access_token: accessToken });
  const oauth2 = google.oauth2({ version: "v2", auth: client });
  const { data } = await oauth2.userinfo.get();
  return data?.id && data?.email ? { id: data.id, email: data.email } : data?.id ? { id: data.id, email: null } : null;
}

/**
 * Google / YouTube keys: lê primeiro do banco (admin panel), depois fallback em process.env.
 * Usado apenas em API routes (server).
 */
import { getPrisma } from "./prisma";

export async function getGoogleClientId(): Promise<string | null> {
  const prisma = getPrisma();
  if (prisma) {
    const row = await prisma.platformSetting.findUnique({
      where: { id: 1 },
      select: { google_client_id: true },
    });
    if (row?.google_client_id?.trim()) return row.google_client_id.trim();
  }
  return process.env.GOOGLE_CLIENT_ID?.trim() ?? null;
}

export async function getGoogleClientSecret(): Promise<string | null> {
  const prisma = getPrisma();
  if (prisma) {
    const row = await prisma.platformSetting.findUnique({
      where: { id: 1 },
      select: { google_client_secret: true },
    });
    if (row?.google_client_secret?.trim()) return row.google_client_secret.trim();
  }
  return process.env.GOOGLE_CLIENT_SECRET?.trim() ?? null;
}

export async function getYoutubeApiKey(): Promise<string | null> {
  const prisma = getPrisma();
  if (prisma) {
    const row = await prisma.platformSetting.findUnique({
      where: { id: 1 },
      select: { youtube_api_key: true },
    });
    if (row?.youtube_api_key?.trim()) return row.youtube_api_key.trim();
  }
  return process.env.YOUTUBE_API_KEY?.trim() || process.env.GOOGLE_API_KEY?.trim() || null;
}

/** Retorna as duas juntas para OAuth (client_id + client_secret). */
export async function getGoogleOAuthKeys(): Promise<{ clientId: string; clientSecret: string } | null> {
  const [clientId, clientSecret] = await Promise.all([getGoogleClientId(), getGoogleClientSecret()]);
  if (clientId && clientSecret) return { clientId, clientSecret };
  return null;
}

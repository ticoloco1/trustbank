import { NextRequest, NextResponse } from "next/server";
import { getGoogleAuthUrl } from "@/lib/youtube";

/**
 * GET /api/auth/google — redireciona para o login do Google (escopo YouTube).
 * Após autorizar, o usuário volta em /api/auth/google/callback.
 */
export async function GET(request: NextRequest) {
  const redirectUri = request.nextUrl.origin + "/api/auth/google/callback";
  const url = getGoogleAuthUrl(redirectUri);
  if (!url) {
    return NextResponse.json(
      { error: "Google OAuth não configurado. Defina GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET." },
      { status: 503 }
    );
  }
  return NextResponse.redirect(url);
}

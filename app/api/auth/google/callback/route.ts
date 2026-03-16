import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/youtube";

const COOKIE_NAME = "tb_google_token";
const COOKIE_MAX_AGE = 60 * 60; // 1 hora

/**
 * GET /api/auth/google/callback?code=xxx — Google redireciona aqui após o usuário autorizar.
 * Troca o code por access_token, grava em cookie e redireciona para /dashboard.
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const redirectUri = request.nextUrl.origin + "/api/auth/google/callback";
  const dashboardUrl = request.nextUrl.origin + "/dashboard";
  const returnPath = state && state.startsWith("/") && !state.includes("//") ? state : null;
  const successUrl = returnPath ? request.nextUrl.origin + returnPath : dashboardUrl;

  if (!code) {
    return NextResponse.redirect((returnPath ? successUrl : dashboardUrl) + "?google_error=missing_code");
  }

  const tokens = await exchangeCodeForTokens(code, redirectUri);
  if (!tokens) {
    return NextResponse.redirect((returnPath ? successUrl : dashboardUrl) + "?google_error=exchange_failed");
  }

  const res = NextResponse.redirect(successUrl);
  res.cookies.set(COOKIE_NAME, tokens.access_token, {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
  });
  return res;
}

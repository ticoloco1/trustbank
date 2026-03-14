import { NextRequest, NextResponse } from "next/server";
import { getGoogleUserInfo } from "@/lib/youtube";

const COOKIE_NAME = "tb_google_token";

/**
 * GET /api/auth/google/session — retorna { email, id } se houver token Google no cookie; senão { user: null }.
 * Usado pelo painel para saber se o usuário está logado com Google (para vídeos/paywall).
 */
export async function GET(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ user: null });
  }
  const user = await getGoogleUserInfo(token);
  if (!user) {
    return NextResponse.json({ user: null });
  }
  return NextResponse.json({ user: { id: user.id, email: user.email } });
}

/**
 * DELETE /api/auth/google/session — remove o cookie (logout Google).
 */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set("tb_google_token", "", { path: "/", maxAge: 0 });
  return res;
}

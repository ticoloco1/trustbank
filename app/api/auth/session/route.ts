import { NextRequest, NextResponse } from "next/server";
import { getSessionFromCookie, COOKIE_NAME } from "@/lib/auth";

/**
 * GET /api/auth/session — retorna o usuário da sessão (login próprio).
 * Cookie: tb_session (cookie assinado).
 * Resposta: { user: { id, email } | null }
 */
export async function GET(request: NextRequest) {
  const cookieHeader = request.headers.get("cookie") ?? undefined;
  const payload = getSessionFromCookie(cookieHeader);
  if (!payload) {
    return NextResponse.json({ user: null });
  }
  return NextResponse.json({
    user: { id: payload.userId, email: payload.email },
  });
}

/**
 * DELETE /api/auth/session — logout (remove cookie).
 */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, "", { path: "/", maxAge: 0 });
  return res;
}

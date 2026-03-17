import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { verifyPassword, createSessionToken, COOKIE_NAME } from "@/lib/auth";

/**
 * POST /api/auth/login — login com email e senha.
 * Body: { email: string, password: string }
 */
export async function POST(request: NextRequest) {
  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json({ error: "Serviço indisponível" }, { status: 503 });
  }
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!email || !password) {
      return NextResponse.json({ error: "E-mail e senha são obrigatórios" }, { status: 400 });
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await verifyPassword(password, user.password_hash))) {
      return NextResponse.json({ error: "E-mail ou senha incorretos" }, { status: 401 });
    }
    const token = createSessionToken({ userId: user.id, email: user.email });
    const res = NextResponse.json({ user: { id: user.id, email: user.email } });
    res.cookies.set(COOKIE_NAME, token, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
    return res;
  } catch (e) {
    console.error("[api/auth/login]", e);
    return NextResponse.json({ error: "Erro ao entrar" }, { status: 500 });
  }
}

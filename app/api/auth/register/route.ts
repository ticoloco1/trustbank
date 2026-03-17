import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { hashPassword, createSessionToken, COOKIE_NAME } from "@/lib/auth";

/**
 * POST /api/auth/register — cria conta com email e senha.
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
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "E-mail inválido" }, { status: 400 });
    }
    if (!password || password.length < 6) {
      return NextResponse.json({ error: "Senha deve ter pelo menos 6 caracteres" }, { status: 400 });
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Este e-mail já está cadastrado" }, { status: 409 });
    }
    const password_hash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { email, password_hash },
    });
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
    console.error("[api/auth/register]", e);
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("SESSION_SECRET")) {
      return NextResponse.json(
        { error: "Configure SESSION_SECRET no Vercel (Settings → Environment Variables) e faça redeploy." },
        { status: 503 }
      );
    }
    if (msg.includes("DATABASE") || msg.includes("prisma") || msg.includes("connect")) {
      return NextResponse.json(
        { error: "Banco indisponível. Verifique DATABASE_URL no Vercel e redeploy." },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: "Erro ao criar conta. Tente de novo." }, { status: 500 });
  }
}

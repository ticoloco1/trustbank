import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/health
 * Diagnóstico: prisma = banco; sessionSecret = login/criar conta funcionam.
 * expectPrisma: true só quando este deploy usa Prisma como banco (ex.: TrustBank).
 * Hashpo (Supabase) não espera Prisma → banner "sem banco" não aparece.
 */
export async function GET() {
  const prisma = getPrisma();
  const hasSessionSecret =
    typeof process.env.SESSION_SECRET === "string" && process.env.SESSION_SECRET.length >= 16;
  const usePrisma = process.env.NEXT_PUBLIC_USE_PRISMA === "true";
  const hasSupabase = !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  const expectPrisma = usePrisma || (!hasSupabase && !!process.env.DATABASE_URL) || false;
  const messages: string[] = [];
  if (!prisma && expectPrisma)
    messages.push("DATABASE_URL não configurada no Vercel. Configure e faça redeploy.");
  if (!hasSessionSecret)
    messages.push(
      "SESSION_SECRET não configurada. Crie uma no Vercel (Environment Variables) com 16+ caracteres e faça redeploy."
    );
  return NextResponse.json({
    ok: true,
    prisma: !!prisma,
    expectPrisma,
    sessionSecret: hasSessionSecret,
    message:
      messages.length > 0
        ? messages.join(" ")
        : "DB e login OK. Criar conta e Entrar devem funcionar.",
  });
}

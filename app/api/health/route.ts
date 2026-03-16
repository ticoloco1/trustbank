import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/health
 * Para diagnosticar no host: se prisma === false, DATABASE_URL não está configurada no Vercel.
 */
export async function GET() {
  const prisma = getPrisma();
  return NextResponse.json({
    ok: true,
    prisma: !!prisma,
    message: prisma
      ? "DB conectado. Pesquisa e mini-sites devem funcionar."
      : "DATABASE_URL não configurada. Configure no Vercel → Settings → Environment Variables e faça redeploy.",
  });
}

import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

/**
 * TrustBank 100% Prisma: verifica se o wallet é admin.
 * GET /api/auth/me?wallet=0x...
 * Retorna { user: { id }, isAdmin } para o front usar no useAuth quando USE_PRISMA.
 *
 * Admin pode vir de:
 * 1. Tabela admin_wallet_addresses (Prisma)
 * 2. Variável de ambiente ADMIN_WALLET (um endereço) ou ADMIN_WALLETS (vários, separados por vírgula)
 *    Assim você entra no admin sem precisar inserir no banco — configure no Vercel e faça redeploy.
 */
function isAdminByEnv(wallet: string): boolean {
  const w = wallet.toLowerCase();
  const single = process.env.ADMIN_WALLET?.toLowerCase().trim();
  if (single && single.startsWith("0x") && single === w) return true;
  const list = process.env.ADMIN_WALLETS;
  if (!list) return false;
  const addrs = list.split(",").map((s) => s.trim().toLowerCase()).filter((s) => s.startsWith("0x"));
  return addrs.includes(w);
}

export async function GET(request: NextRequest) {
  const wallet = request.nextUrl.searchParams.get("wallet")?.toLowerCase();
  if (!wallet || !wallet.startsWith("0x")) {
    return NextResponse.json({ user: null, isAdmin: false });
  }

  if (isAdminByEnv(wallet)) {
    return NextResponse.json({
      user: { id: wallet, email: null },
      isAdmin: true,
    });
  }

  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json({ user: null, isAdmin: false });
  }
  try {
    const admin = await prisma.adminWalletAddress.findUnique({
      where: { wallet_address: wallet },
    });
    const isAdmin = !!admin;
    return NextResponse.json({
      user: isAdmin ? { id: wallet, email: null } : null,
      isAdmin,
    });
  } catch (e) {
    console.error("[api/auth/me]", e);
    return NextResponse.json({ user: null, isAdmin: false });
  }
}

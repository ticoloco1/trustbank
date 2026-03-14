import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

/**
 * TrustBank 100% Prisma: verifica se o wallet é admin.
 * GET /api/auth/me?wallet=0x...
 * Retorna { user: { id }, isAdmin } para o front usar no useAuth quando USE_PRISMA.
 */
export async function GET(request: NextRequest) {
  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json({ user: null, isAdmin: false });
  }
  const wallet = request.nextUrl.searchParams.get("wallet")?.toLowerCase();
  if (!wallet || !wallet.startsWith("0x")) {
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

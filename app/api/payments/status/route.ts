import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { getPlatformWallet } from "@/lib/payment-config";

/**
 * GET /api/payments/status — indica se o sistema de pagamento/blockchain está pronto.
 * Útil para debug e para o front exibir avisos.
 */
export async function GET() {
  const prisma = getPrisma();
  const database_ok = !!prisma;
  const wallet = getPlatformWallet();
  const destination_ok = !!(wallet && wallet.startsWith("0x"));
  const eth_rpc = !!(process.env.ETH_RPC_URL || process.env.CHAIN_RPC_URL);
  const polygon_rpc = !!process.env.POLYGON_RPC_URL;
  const blockchain_verify_ok = eth_rpc || polygon_rpc;
  const stripe_ok = !!process.env.STRIPE_SECRET_KEY;

  return NextResponse.json({
    database_ok,
    destination_wallet_configured: destination_ok,
    destination: destination_ok ? wallet : null,
    blockchain_verification_available: blockchain_verify_ok,
    chains: { ethereum: eth_rpc, polygon: polygon_rpc },
    stripe_configured: stripe_ok,
    ready: database_ok && destination_ok,
    message:
      !database_ok
        ? "Set DATABASE_URL for payments to be stored."
        : !destination_ok
          ? "Set PLATFORM_WALLET or use default contract."
          : !blockchain_verify_ok
            ? "Set ETH_RPC_URL or POLYGON_RPC_URL to verify USDC payments on chain."
            : "Payment system ready. Card payments require STRIPE_SECRET_KEY and webhook.",
  });
}

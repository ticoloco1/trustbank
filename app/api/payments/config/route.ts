import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { getPlatformWallet } from "@/lib/payment-config";

/**
 * GET /api/payments/config
 * Query: ?type=VIDEO_UNLOCK&reference_id=xxx | ?type=SLUG_PURCHASE&reference_id=xxx | ?type=MINISITE_SUBSCRIPTION&reference_id=xxx
 * Retorna: destination_wallet (onde enviar USDC), amount_usdc, label (descrição).
 */
export async function GET(request: Request) {
  const prisma = getPrisma();
  if (!prisma) return NextResponse.json({ error: "Prisma not configured" }, { status: 503 });

  const platformWallet = getPlatformWallet();
  if (!platformWallet) {
    return NextResponse.json({ error: "Platform wallet not configured" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const referenceId = searchParams.get("reference_id");

  if (!type || !referenceId) {
    return NextResponse.json({
      destination_wallet: platformWallet,
      message: "Use ?type=VIDEO_UNLOCK|SLUG_PURCHASE|MINISITE_SUBSCRIPTION e &reference_id=... para valor e label.",
    });
  }

  let amount_usdc: string;
  let label: string;

  if (type === "VIDEO_UNLOCK") {
    const video = await prisma.video.findUnique({
      where: { id: referenceId },
      select: { title: true, paywall_price_usdc: true, paywall_enabled: true },
    });
    if (!video?.paywall_enabled) {
      return NextResponse.json({ error: "Vídeo não encontrado ou sem paywall" }, { status: 404 });
    }
    amount_usdc = video.paywall_price_usdc || "0";
    label = `Paywall: ${video.title || referenceId}`;
  } else if (type === "SLUG_PURCHASE") {
    const listing = await prisma.slugListing.findUnique({
      where: { id: referenceId },
      include: { mini_site: { select: { site_name: true, slug: true } } },
    });
    if (!listing || listing.status !== "active") {
      return NextResponse.json({ error: "Listing not available" }, { status: 404 });
    }
    const isAuctionEnded =
      listing.listing_type === "auction" && listing.end_at && new Date(listing.end_at) <= new Date();
    amount_usdc =
      isAuctionEnded && listing.current_bid_usdc ? listing.current_bid_usdc : listing.price_usdc;
    const slugLabel = listing.mini_site?.slug ?? listing.slug_value ?? referenceId;
    label = `Slug: ${slugLabel}`;
  } else if (type === "MINISITE_SUBSCRIPTION") {
    const site = await prisma.miniSite.findUnique({
      where: { id: referenceId },
      select: { site_name: true, slug: true, monthly_price_usdc: true },
    });
    if (!site?.monthly_price_usdc) {
      return NextResponse.json({ error: "Mini site sem plano mensal" }, { status: 404 });
    }
    amount_usdc = site.monthly_price_usdc;
    label = `Mensalidade: ${site.slug || site.site_name || referenceId}`;
  } else {
    return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
  }

  const acceptedChains: string[] = [];
  if (process.env.ETH_RPC_URL || process.env.CHAIN_RPC_URL) acceptedChains.push("ethereum");
  if (process.env.POLYGON_RPC_URL) acceptedChains.push("polygon");

  return NextResponse.json({
    destination_wallet: platformWallet,
    amount_usdc,
    label,
    type,
    reference_id: referenceId,
    accepted_chains: acceptedChains.length ? acceptedChains : ["ethereum"],
    message: "Send this amount in USDC to destination_wallet (Ethereum or Polygon). Then call POST /api/payments/verify with tx_hash.",
  });
}

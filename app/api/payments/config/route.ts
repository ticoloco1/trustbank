import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

/**
 * GET /api/payments/config
 * Query: ?type=VIDEO_UNLOCK&reference_id=xxx | ?type=SLUG_PURCHASE&reference_id=xxx | ?type=MINISITE_SUBSCRIPTION&reference_id=xxx
 * Retorna: destination_wallet (onde enviar USDC), amount_usdc, label (descrição).
 */
export async function GET(request: Request) {
  const prisma = getPrisma();
  if (!prisma) return NextResponse.json({ error: "Prisma not configured" }, { status: 503 });

  const platformWallet = process.env.PLATFORM_WALLET;
  if (!platformWallet) {
    return NextResponse.json({ error: "PLATFORM_WALLET não configurado" }, { status: 503 });
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
      return NextResponse.json({ error: "Listagem não disponível" }, { status: 404 });
    }
    amount_usdc = listing.price_usdc;
    label = `Compra slug: ${listing.mini_site.slug || listing.mini_site.site_name || referenceId}`;
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

  return NextResponse.json({
    destination_wallet: platformWallet,
    amount_usdc,
    label,
    type,
    reference_id: referenceId,
    message: "Envie exatamente este valor em USDC para destination_wallet. Depois chame POST /api/payments/verify com o tx_hash.",
  });
}

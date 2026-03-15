import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { verifyUsdcPayment } from "@/lib/verify-payment";
import {
  splitVideoPaywall,
  splitSlugSale,
  STANDALONE_SLUG_ANNUAL_USD,
} from "@/lib/payment-config";

const PAYMENT_TYPES = ["VIDEO_UNLOCK", "SLUG_PURCHASE", "MINISITE_SUBSCRIPTION", "OTHER"] as const;

/**
 * POST /api/payments/verify
 * Body: { type: VIDEO_UNLOCK | SLUG_PURCHASE | MINISITE_SUBSCRIPTION | OTHER, tx_hash: string, reference_id?: string, payer_wallet?: string }
 * Verifica a tx na chain e, se válida, registra o pagamento e executa a ação (unlock vídeo, transferir slug, renovar mensalidade).
 */
export async function POST(request: NextRequest) {
  const prisma = getPrisma();
  if (!prisma) return NextResponse.json({ error: "Prisma not configured" }, { status: 503 });

  try {
    const body = (await request.json()) as {
      type?: string;
      tx_hash?: string;
      reference_id?: string;
      payer_wallet?: string;
    };
    const { type, tx_hash, reference_id, payer_wallet } = body;

    if (!type || !PAYMENT_TYPES.includes(type as (typeof PAYMENT_TYPES)[number])) {
      return NextResponse.json(
        { error: "invalid_type", message: "type deve ser: VIDEO_UNLOCK | SLUG_PURCHASE | MINISITE_SUBSCRIPTION | OTHER" },
        { status: 400 }
      );
    }
    if (!tx_hash || !tx_hash.trim()) {
      return NextResponse.json({ error: "missing_tx_hash", message: "tx_hash é obrigatório." }, { status: 400 });
    }

    let minAmount: number | undefined;
    if (type === "VIDEO_UNLOCK" && reference_id) {
      const video = await prisma.video.findUnique({
        where: { id: reference_id },
        select: { paywall_price_usdc: true, paywall_enabled: true },
      });
      if (!video?.paywall_enabled) {
        return NextResponse.json({ error: "video_not_found_or_no_paywall" }, { status: 400 });
      }
      const price = parseFloat(video.paywall_price_usdc || "0");
      if (price > 0) minAmount = price;
    }
    if (type === "SLUG_PURCHASE" && reference_id) {
      const listing = await prisma.slugListing.findUnique({
        where: { id: reference_id },
        include: { mini_site: true, bids: { orderBy: { amount_usdc: "desc" }, take: 1 } },
      });
      if (!listing || listing.status !== "active") {
        return NextResponse.json({ error: "listing_not_available" }, { status: 400 });
      }
      const isAuctionEnded =
        listing.listing_type === "auction" && listing.end_at && new Date(listing.end_at) <= new Date();
      minAmount = isAuctionEnded && listing.current_bid_usdc
        ? parseFloat(listing.current_bid_usdc)
        : parseFloat(listing.price_usdc);
    }
    if (type === "MINISITE_SUBSCRIPTION" && reference_id) {
      const site = await prisma.miniSite.findUnique({
        where: { id: reference_id },
        select: { monthly_price_usdc: true, subscription_plan: true },
      });
      if (!site?.monthly_price_usdc) {
        return NextResponse.json({ error: "minisite_no_monthly_plan" }, { status: 400 });
      }
      minAmount = parseFloat(site.monthly_price_usdc);
    }

    const verification = await verifyUsdcPayment({
      txHash: tx_hash.trim(),
      minAmountUsdc: minAmount,
    });

    if (!verification.success) {
      return NextResponse.json(
        { error: "verification_failed", message: verification.error },
        { status: 400 }
      );
    }

    const fromWallet = verification.from.toLowerCase();
    const payer = (payer_wallet || fromWallet).toLowerCase();
    const amountStr = verification.amount;

    const existingPayment = await prisma.payment.findUnique({
      where: { tx_hash: tx_hash.trim() },
    });
    if (existingPayment) {
      return NextResponse.json({
        message: "Pagamento já registrado.",
        payment: existingPayment,
      });
    }

    if (type === "VIDEO_UNLOCK" && reference_id) {
      const video = await prisma.video.findUnique({
        where: { id: reference_id },
        select: { id: true, paywall_enabled: true },
      });
      if (!video?.paywall_enabled) {
        return NextResponse.json({ error: "video_invalid" }, { status: 400 });
      }
      const existingUnlock = await prisma.videoUnlock.findUnique({
        where: { video_id_viewer_id: { video_id: reference_id, viewer_id: fromWallet } },
      });
      if (existingUnlock) {
        return NextResponse.json({ message: "Video already unlocked for this wallet.", unlock: existingUnlock });
      }

      const amountNum = parseFloat(amountStr);
      const { creator_usdc, platform_usdc } = splitVideoPaywall(amountNum);

      const [payment, unlock] = await prisma.$transaction(async (tx) => {
        const p = await tx.payment.create({
          data: {
            type: "VIDEO_UNLOCK",
            amount_usdc: amountStr,
            payer_wallet: fromWallet,
            payment_method: "crypto",
            tx_hash: tx_hash.trim(),
            reference_type: "video",
            reference_id,
            status: "verified",
            verified_at: new Date(),
            creator_share_usdc: creator_usdc,
            platform_share_usdc: platform_usdc,
          },
        });
        const u = await tx.videoUnlock.create({
          data: {
            video_id: reference_id,
            viewer_id: fromWallet,
            viewer_wallet: fromWallet,
            tx_hash: tx_hash.trim(),
            amount_usdc: amountStr,
            payment_id: p.id,
          },
        });
        return [p, u];
      });

      return NextResponse.json({ success: true, payment, unlock, message: "Vídeo desbloqueado." });
    }

    if (type === "SLUG_PURCHASE" && reference_id) {
      const listing = await prisma.slugListing.findUnique({
        where: { id: reference_id },
        include: { mini_site: true, bids: { orderBy: { amount_usdc: "desc" }, take: 1 } },
      });
      if (!listing || listing.status !== "active") {
        return NextResponse.json({ error: "listing_not_available" }, { status: 400 });
      }
      if (listing.seller_wallet === fromWallet) {
        return NextResponse.json({ error: "cannot_buy_own", message: "You cannot buy your own listing." }, { status: 400 });
      }
      const isAuctionEnded =
        listing.listing_type === "auction" && listing.end_at && new Date(listing.end_at) <= new Date();
      if (isAuctionEnded && listing.bids?.[0]) {
        const winnerWallet = listing.bids[0].bidder_wallet.toLowerCase();
        if (winnerWallet !== fromWallet) {
          return NextResponse.json({
            error: "not_auction_winner",
            message: "Only the highest bidder can complete this purchase.",
          }, { status: 403 });
        }
      }
      const priceNum = isAuctionEnded && listing.current_bid_usdc
        ? parseFloat(listing.current_bid_usdc)
        : parseFloat(listing.price_usdc);
      const { platform_fee_usdc: platformFeeStr, seller_receives_usdc: sellerReceivesStr } = splitSlugSale(priceNum);

      await prisma.$transaction(async (tx) => {
        await tx.payment.create({
          data: {
            type: "SLUG_PURCHASE",
            amount_usdc: amountStr,
            payer_wallet: fromWallet,
            payment_method: "crypto",
            tx_hash: tx_hash.trim(),
            reference_type: "slug_listing",
            reference_id,
            status: "verified",
            verified_at: new Date(),
          },
        });
        await tx.slugListing.update({
          where: { id: reference_id },
          data: { status: "sold", updated_at: new Date() },
        });
        if (listing.mini_site_id) {
          await tx.miniSite.update({
            where: { id: listing.mini_site_id },
            data: { user_id: fromWallet, updated_at: new Date() },
          });
        } else if (listing.slug_value) {
          const nextRenewal = new Date();
          nextRenewal.setFullYear(nextRenewal.getFullYear() + 1);
          await tx.miniSite.create({
            data: {
              user_id: fromWallet,
              slug: listing.slug_value,
              site_name: listing.slug_value.replace(/^@/, ""),
              slug_annual_renewal_usdc: STANDALONE_SLUG_ANNUAL_USD,
              next_slug_renewal_at: nextRenewal,
            },
          });
        }
        await tx.slugPurchase.create({
          data: {
            listing_id: reference_id,
            buyer_wallet: fromWallet,
            tx_hash: tx_hash.trim(),
            amount_usdc: priceNum.toFixed(2),
            platform_fee_usdc: platformFeeStr,
            seller_receives_usdc: sellerReceivesStr,
            status: "payout_pending",
          },
        });
      });

      const purchase = await prisma.slugPurchase.findFirst({
        where: { listing_id: reference_id, buyer_wallet: fromWallet },
        orderBy: { completed_at: "desc" },
      });
      return NextResponse.json({
        success: true,
        message: "Slug acquired. 90% will be sent to the seller (10% fee).",
        purchase,
      });
    }

    if (type === "MINISITE_SUBSCRIPTION" && reference_id) {
      const site = await prisma.miniSite.findUnique({
        where: { id: reference_id },
        select: { id: true, monthly_price_usdc: true },
      });
      if (!site) {
        return NextResponse.json({ error: "minisite_not_found" }, { status: 404 });
      }
      const nextBilling = new Date();
      nextBilling.setMonth(nextBilling.getMonth() + 1);

      await prisma.$transaction(async (tx) => {
        await tx.payment.create({
          data: {
            type: "MINISITE_SUBSCRIPTION",
            amount_usdc: amountStr,
            payer_wallet: fromWallet,
            payment_method: "crypto",
            tx_hash: tx_hash.trim(),
            reference_type: "mini_site",
            reference_id,
            status: "verified",
            verified_at: new Date(),
            mini_site_id: reference_id,
          },
        });
        await tx.miniSite.update({
          where: { id: reference_id },
          data: {
            subscription_plan: "monthly",
            monthly_price_usdc: site.monthly_price_usdc,
            next_billing_at: nextBilling,
            updated_at: new Date(),
          },
        });
      });

      return NextResponse.json({
        success: true,
        message: "Mensalidade paga. Próxima cobrança: " + nextBilling.toISOString().slice(0, 10),
        next_billing_at: nextBilling,
      });
    }

    if (type === "OTHER") {
      const payment = await prisma.payment.create({
        data: {
          type: "OTHER",
          amount_usdc: amountStr,
          payer_wallet: fromWallet,
          payment_method: "crypto",
          tx_hash: tx_hash.trim(),
          reference_type: reference_id ? "custom" : null,
          reference_id: reference_id || null,
          status: "verified",
          verified_at: new Date(),
        },
      });
      return NextResponse.json({ success: true, payment, message: "Pagamento registrado." });
    }

    return NextResponse.json({ error: "invalid_type_or_reference" }, { status: 400 });
  } catch (e) {
    console.error("[api/payments/verify]", e);
    return NextResponse.json(
      { error: "server_error", message: e instanceof Error ? e.message : "Erro ao verificar pagamento." },
      { status: 500 }
    );
  }
}

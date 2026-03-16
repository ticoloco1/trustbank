import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import Stripe from "stripe";
import { splitVideoPaywall, splitSlugSale, STANDALONE_SLUG_ANNUAL_USD } from "@/lib/payment-config";

/**
 * POST /api/webhooks/stripe
 * Webhook Stripe: checkout.session.completed → registra Payment (cartão), libera acesso e marca para repasse em USDC.
 * Configurar no Stripe: URL deste endpoint, evento checkout.session.completed.
 * Assinatura validada com STRIPE_WEBHOOK_SECRET.
 */
export async function POST(request: NextRequest) {
  const prisma = getPrisma();
  if (!prisma) return NextResponse.json({ error: "Prisma not configured" }, { status: 503 });

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[webhooks/stripe] STRIPE_WEBHOOK_SECRET não configurado");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 503 });
  }

  const body = await request.text();
  const sig = request.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Invalid signature";
    console.error("[webhooks/stripe]", msg);
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const { type, reference_id, amount_usdc, cart: cartRaw } = session.metadata || {};
  const customerEmail = (session.customer_email || session.customer_details?.email || "").toLowerCase();
  const stripeId = session.id;

  if (type === "CART" && cartRaw) {
    const existing = await prisma.payment.findFirst({
      where: { stripe_payment_id: { startsWith: stripeId } },
    });
    if (existing) {
      return NextResponse.json({ received: true, message: "Cart already processed" });
    }
    let cart: { type: string; reference_id: string; label?: string; amount_usdc: string }[];
    try {
      cart = JSON.parse(cartRaw) as typeof cart;
      if (!Array.isArray(cart) || cart.length === 0) {
        return NextResponse.json({ error: "Invalid cart" }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: "Invalid cart JSON" }, { status: 400 });
    }
    try {
      for (let idx = 0; idx < cart.length; idx++) {
        const item = cart[idx];
        const itemStripeId = `${stripeId}_${idx}`;
        await processOneStripePayment(prisma, {
          type: item.type,
          reference_id: item.reference_id,
          amount_usdc: item.amount_usdc,
          stripeId: itemStripeId,
          customerEmail,
        });
      }
      console.log("[webhooks/stripe] CART ok", stripeId, cart.length, "items");
      return NextResponse.json({ received: true });
    } catch (e) {
      console.error("[webhooks/stripe] CART error", e);
      return NextResponse.json(
        { error: "server_error", message: e instanceof Error ? e.message : "Erro ao processar carrinho" },
        { status: 500 }
      );
    }
  }

  if (!type || !reference_id || !amount_usdc) {
    console.error("[webhooks/stripe] metadata incompleto:", session.metadata);
    return NextResponse.json({ error: "Invalid metadata" }, { status: 400 });
  }

  const existing = await prisma.payment.findFirst({
    where: { stripe_payment_id: stripeId },
  });
  if (existing) {
    return NextResponse.json({ received: true, message: "Already processed" });
  }

  try {
    await processOneStripePayment(prisma, {
      type,
      reference_id,
      amount_usdc,
      stripeId,
      customerEmail,
    });
    return NextResponse.json({ received: true });
  } catch (e) {
    console.error("[webhooks/stripe]", e);
    return NextResponse.json(
      { error: "server_error", message: e instanceof Error ? e.message : "Erro ao processar" },
      { status: 500 }
    );
  }
}

async function processOneStripePayment(
  prisma: Awaited<ReturnType<typeof getPrisma>>,
  params: { type: string; reference_id: string; amount_usdc: string; stripeId: string; customerEmail: string }
) {
  const { type, reference_id, amount_usdc, stripeId, customerEmail } = params;
  if (!prisma) throw new Error("Prisma not configured");

  if (type === "VIDEO_UNLOCK") {
      const viewerId = customerEmail ? `email:${customerEmail}` : `session:${stripeId}`;
      const existingUnlock = await prisma.videoUnlock.findUnique({
        where: { video_id_viewer_id: { video_id: reference_id, viewer_id: viewerId } },
      });
      if (existingUnlock) return;

      const amountNum = parseFloat(amount_usdc);
      const { creator_usdc, platform_usdc } = splitVideoPaywall(amountNum);

      const [payment, unlock] = await prisma.$transaction(async (tx) => {
        const p = await tx.payment.create({
          data: {
            type: "VIDEO_UNLOCK",
            amount_usdc: amount_usdc,
            payer_wallet: null,
            payer_email: customerEmail || null,
            payment_method: "card",
            tx_hash: null,
            stripe_payment_id: stripeId,
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
            viewer_id: viewerId,
            viewer_wallet: null,
            viewer_email: customerEmail || null,
            amount_usdc: amount_usdc,
            payment_id: p.id,
          },
        });
        return [p, u];
      });
      console.log("[webhooks/stripe] VIDEO_UNLOCK ok", payment.id, unlock.id);
    } else if (type === "SLUG_PURCHASE") {
      const listing = await prisma.slugListing.findUnique({
        where: { id: reference_id },
        include: { mini_site: true, bids: { orderBy: { amount_usdc: "desc" }, take: 1 } },
      });
      if (!listing || listing.status !== "active") {
        console.error("[webhooks/stripe] listing not available", reference_id);
        throw new Error("Listing not available");
      }
      const buyerId = customerEmail ? `email:${customerEmail}` : `session:${stripeId}`;
      const isAuctionEnded =
        listing.listing_type === "auction" && listing.end_at && new Date(listing.end_at) <= new Date();
      const priceNum =
        isAuctionEnded && listing.current_bid_usdc
          ? parseFloat(listing.current_bid_usdc)
          : parseFloat(listing.price_usdc);
      const { platform_fee_usdc: platformFeeStr, seller_receives_usdc: sellerReceivesStr } = splitSlugSale(priceNum);

      await prisma.$transaction(async (tx) => {
        await tx.payment.create({
          data: {
            type: "SLUG_PURCHASE",
            amount_usdc: amount_usdc,
            payer_wallet: null,
            payer_email: customerEmail || null,
            payment_method: "card",
            stripe_payment_id: stripeId,
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
            data: { user_id: buyerId, updated_at: new Date() },
          });
        } else if (listing.slug_value) {
          const nextRenewal = new Date();
          nextRenewal.setFullYear(nextRenewal.getFullYear() + 1);
          await tx.miniSite.create({
            data: {
              user_id: buyerId,
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
            buyer_wallet: buyerId,
            tx_hash: null,
            amount_usdc: priceNum.toFixed(2),
            platform_fee_usdc: platformFeeStr,
            seller_receives_usdc: sellerReceivesStr,
            status: "payout_pending",
          },
        });
      });
      console.log("[webhooks/stripe] SLUG_PURCHASE ok", reference_id);
    } else if (type === "SLUG_CLAIM") {
      const slug = (reference_id as string).replace(/^\@/, "").toLowerCase();
      if (!/^[a-z0-9_-]+$/i.test(slug)) {
        console.error("[webhooks/stripe] invalid slug", reference_id);
        throw new Error("Invalid slug");
      }
      const existingSite = await prisma.miniSite.findUnique({ where: { slug } });
      const activeListing = await prisma.slugListing.findFirst({
        where: { status: "active", OR: [{ slug_value: slug }, { slug_value: `@${slug}` }] },
      });
      if (existingSite || activeListing) {
        console.error("[webhooks/stripe] slug no longer available", slug);
        throw new Error("Slug no longer available");
      }
      const buyerId = customerEmail ? `email:${customerEmail}` : `session:${stripeId}`;
      const nextRenewal = new Date();
      nextRenewal.setFullYear(nextRenewal.getFullYear() + 1);
      await prisma.$transaction(async (tx) => {
        await tx.payment.create({
          data: {
            type: "SLUG_CLAIM",
            amount_usdc: amount_usdc,
            payer_email: customerEmail || null,
            payment_method: "card",
            stripe_payment_id: stripeId,
            reference_type: "slug_claim",
            reference_id: slug,
            status: "verified",
            verified_at: new Date(),
          },
        });
        await tx.miniSite.create({
          data: {
            user_id: buyerId,
            slug,
            site_name: slug.replace(/^@/, ""),
            slug_annual_renewal_usdc: STANDALONE_SLUG_ANNUAL_USD,
            next_slug_renewal_at: nextRenewal,
          },
        });
      });
      console.log("[webhooks/stripe] SLUG_CLAIM ok", slug);
    } else if (type === "MINISITE_SUBSCRIPTION") {
      const { MINISITE_MONTHLY_USD } = await import("@/lib/payment-config");
      const nextBilling = new Date();
      nextBilling.setMonth(nextBilling.getMonth() + 1);

      await prisma.$transaction(async (tx) => {
        const site = await tx.miniSite.findUnique({
          where: { id: reference_id },
          select: { monthly_price_usdc: true },
        });
        if (!site) return;
        const priceUsdc = site.monthly_price_usdc?.trim() || MINISITE_MONTHLY_USD;
        await tx.payment.create({
          data: {
            type: "MINISITE_SUBSCRIPTION",
            amount_usdc: amount_usdc,
            payer_email: customerEmail || null,
            payment_method: "card",
            stripe_payment_id: stripeId,
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
            monthly_price_usdc: priceUsdc,
            next_billing_at: nextBilling,
            updated_at: new Date(),
          },
        });
      });
      console.log("[webhooks/stripe] MINISITE_SUBSCRIPTION ok", reference_id);
    } else {
      await prisma.payment.create({
        data: {
          type: "OTHER",
          amount_usdc: amount_usdc,
          payer_email: customerEmail || null,
          payment_method: "card",
          stripe_payment_id: stripeId,
          reference_id,
          status: "verified",
          verified_at: new Date(),
        },
      });
      console.log("[webhooks/stripe] OTHER ok");
    }
}

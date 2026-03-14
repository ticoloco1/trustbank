import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import Stripe from "stripe";

const PLATFORM_FEE_PERCENT = 10;

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
  const { type, reference_id, amount_usdc } = session.metadata || {};
  const customerEmail = (session.customer_email || session.customer_details?.email || "").toLowerCase();
  const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;

  if (!type || !reference_id || !amount_usdc) {
    console.error("[webhooks/stripe] metadata incompleto:", session.metadata);
    return NextResponse.json({ error: "Invalid metadata" }, { status: 400 });
  }

  const stripeId = session.id; // ou paymentIntentId para unicidade de pagamento
  const existing = await prisma.payment.findFirst({
    where: { stripe_payment_id: stripeId },
  });
  if (existing) {
    return NextResponse.json({ received: true, message: "Already processed" });
  }

  try {
    if (type === "VIDEO_UNLOCK") {
      const viewerId = customerEmail ? `email:${customerEmail}` : `session:${session.id}`;
      const existingUnlock = await prisma.videoUnlock.findUnique({
        where: { video_id_viewer_id: { video_id: reference_id, viewer_id: viewerId } },
      });
      if (existingUnlock) {
        return NextResponse.json({ received: true });
      }

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
        include: { mini_site: true },
      });
      if (!listing || listing.status !== "active") {
        console.error("[webhooks/stripe] listing não disponível", reference_id);
        return NextResponse.json({ error: "Listing not available" }, { status: 400 });
      }
      const buyerId = customerEmail ? `email:${customerEmail}` : `session:${session.id}`;
      const priceNum = parseFloat(listing.price_usdc);
      const platformFee = (priceNum * PLATFORM_FEE_PERCENT) / 100;
      const sellerReceives = priceNum - platformFee;

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
        await tx.miniSite.update({
          where: { id: listing.mini_site_id },
          data: { user_id: buyerId, updated_at: new Date() },
        });
        await tx.slugPurchase.create({
          data: {
            listing_id: reference_id,
            buyer_wallet: buyerId,
            tx_hash: null,
            amount_usdc: listing.price_usdc,
            platform_fee_usdc: platformFee.toFixed(2),
            seller_receives_usdc: sellerReceives.toFixed(2),
            status: "payout_pending",
          },
        });
      });
      console.log("[webhooks/stripe] SLUG_PURCHASE ok", reference_id);
    } else if (type === "MINISITE_SUBSCRIPTION") {
      const nextBilling = new Date();
      nextBilling.setMonth(nextBilling.getMonth() + 1);

      await prisma.$transaction(async (tx) => {
        const site = await tx.miniSite.findUnique({
          where: { id: reference_id },
          select: { monthly_price_usdc: true },
        });
        if (!site) return;
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
            monthly_price_usdc: site.monthly_price_usdc,
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

    return NextResponse.json({ received: true });
  } catch (e) {
    console.error("[webhooks/stripe]", e);
    return NextResponse.json(
      { error: "server_error", message: e instanceof Error ? e.message : "Erro ao processar" },
      { status: 500 }
    );
  }
}

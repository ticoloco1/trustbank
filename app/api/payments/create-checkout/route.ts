import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import Stripe from "stripe";

const PAYMENT_TYPES = ["VIDEO_UNLOCK", "SLUG_PURCHASE", "SLUG_CLAIM", "MINISITE_SUBSCRIPTION", "OTHER", "CART"] as const;

type CartItemPayload = { type: string; reference_id: string; label: string; amount_usdc: string };

/**
 * POST /api/payments/create-checkout
 * Body (single): { type, reference_id, success_url?, cancel_url?, customer_email? }
 * Body (cart): { items: [{ type, reference_id, label, amount_usdc }, ...], success_url?, cancel_url?, customer_email? }
 * Cria sessão Stripe Checkout. Cart = um pagamento único com vários itens; webhook processa cada item.
 */
export async function POST(request: NextRequest) {
  const prisma = getPrisma();
  if (!prisma) return NextResponse.json({ error: "Prisma not configured" }, { status: 503 });

  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return NextResponse.json({ error: "STRIPE_SECRET_KEY não configurado" }, { status: 503 });
  }

  const stripe = new Stripe(secret);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  try {
    const body = (await request.json()) as {
      type?: string;
      reference_id?: string;
      items?: CartItemPayload[];
      success_url?: string;
      cancel_url?: string;
      customer_email?: string;
    };
    const { items: cartItems, success_url, cancel_url, customer_email } = body;

    if (cartItems && Array.isArray(cartItems) && cartItems.length > 0) {
      const amountCentsTotal = cartItems.reduce((sum, it) => {
        const n = parseFloat(it.amount_usdc || "0");
        return sum + (isNaN(n) ? 0 : Math.round(n * 100));
      }, 0);
      if (amountCentsTotal <= 0) {
        return NextResponse.json({ error: "invalid_cart", message: "Cart total must be > 0." }, { status: 400 });
      }
      const lineItems = cartItems.map((it) => ({
        price_data: {
          currency: "usd" as const,
          product_data: {
            name: it.label || `${it.type}: ${it.reference_id}`,
            description: `TrustBank — ${it.type}`,
          },
          unit_amount: Math.round((parseFloat(it.amount_usdc) || 0) * 100),
        },
        quantity: 1 as const,
      }));
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: lineItems,
        mode: "payment",
        success_url: success_url || `${baseUrl}/cart?success=1`,
        cancel_url: cancel_url || `${baseUrl}/cart`,
        customer_email: customer_email || undefined,
        metadata: {
          type: "CART",
          reference_id: "",
          amount_usdc: (amountCentsTotal / 100).toFixed(2),
          cart: JSON.stringify(cartItems),
        },
      });
      return NextResponse.json({
        url: session.url,
        session_id: session.id,
        amount_usdc: (amountCentsTotal / 100).toFixed(2),
        message: "Redirect user to url to pay. Webhook will process each cart item.",
      });
    }

    const type = body.type;
    const reference_id = body.reference_id;
    if (!type || !PAYMENT_TYPES.includes(type as (typeof PAYMENT_TYPES)[number])) {
      return NextResponse.json(
        { error: "invalid_type", message: "type or items[] required." },
        { status: 400 }
      );
    }
    if (!reference_id) {
      return NextResponse.json({ error: "missing_reference_id", message: "reference_id é obrigatório." }, { status: 400 });
    }

    let amountUsdc = "0";
    let label = type;

    if (type === "VIDEO_UNLOCK") {
      const video = await prisma.video.findUnique({
        where: { id: reference_id },
        select: { title: true, paywall_price_usdc: true, paywall_enabled: true },
      });
      if (!video?.paywall_enabled || !video.paywall_price_usdc) {
        return NextResponse.json({ error: "video_not_found_or_no_paywall" }, { status: 400 });
      }
      amountUsdc = video.paywall_price_usdc;
      label = `Vídeo: ${video.title || reference_id}`;
    } else if (type === "SLUG_PURCHASE") {
      const listing = await prisma.slugListing.findUnique({
        where: { id: reference_id },
        include: { mini_site: { select: { slug: true, site_name: true } } },
      });
      if (!listing || listing.status !== "active") {
        return NextResponse.json({ error: "listing_not_available" }, { status: 400 });
      }
      const isAuctionEnded =
        listing.listing_type === "auction" && listing.end_at && new Date(listing.end_at) <= new Date();
      amountUsdc = isAuctionEnded && listing.current_bid_usdc ? listing.current_bid_usdc : listing.price_usdc;
      const slugLabel = listing.mini_site?.slug ?? listing.slug_value ?? reference_id;
      label = `Slug: ${slugLabel}`;
    } else if (type === "SLUG_CLAIM") {
      const { STANDALONE_SLUG_PRICE_USD } = await import("@/lib/payment-config");
      const slug = reference_id.replace(/^\@/, "").toLowerCase();
      if (!/^[a-z0-9_-]+$/i.test(slug)) {
        return NextResponse.json({ error: "invalid_slug" }, { status: 400 });
      }
      const existing = await prisma.miniSite.findUnique({ where: { slug } });
      const listing = await prisma.slugListing.findFirst({
        where: { status: "active", OR: [{ slug_value: slug }, { slug_value: `@${slug}` }] },
      });
      if (existing || listing) {
        return NextResponse.json({ error: "slug_no_longer_available" }, { status: 404 });
      }
      amountUsdc = STANDALONE_SLUG_PRICE_USD;
      label = `Claim slug: ${slug}`;
    } else if (type === "MINISITE_SUBSCRIPTION") {
      const { MINISITE_MONTHLY_USD } = await import("@/lib/payment-config");
      const site = await prisma.miniSite.findUnique({
        where: { id: reference_id },
        select: { slug: true, site_name: true, monthly_price_usdc: true },
      });
      if (!site) {
        return NextResponse.json({ error: "minisite_not_found" }, { status: 404 });
      }
      amountUsdc = site.monthly_price_usdc?.trim() || MINISITE_MONTHLY_USD;
      label = `Mensalidade: ${site.slug || site.site_name || reference_id}`;
    }

    const amountNum = parseFloat(amountUsdc);
    if (isNaN(amountNum) || amountNum <= 0) {
      return NextResponse.json({ error: "invalid_amount" }, { status: 400 });
    }
    const amountCents = Math.round(amountNum * 100);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: label,
              description: `Pagamento TrustBank (valor será repassado em USDC). Tipo: ${type}`,
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: success_url || (type === "SLUG_CLAIM" ? `${baseUrl}/s/${reference_id}?claimed=1` : type === "SLUG_PURCHASE" ? `${baseUrl}/market/${reference_id}?paid=1` : `${baseUrl}/v/${reference_id}?paid=1`),
      cancel_url: cancel_url || baseUrl,
      customer_email: customer_email || undefined,
      metadata: {
        type,
        reference_id,
        amount_usdc: amountUsdc,
      },
    });

    return NextResponse.json({
      url: session.url,
      session_id: session.id,
      amount_usdc: amountUsdc,
      message: "Redirecione o usuário para url para pagar com cartão. Após aprovação, o webhook libera acesso e o valor é repassado em USDC.",
    });
  } catch (e) {
    console.error("[api/payments/create-checkout]", e);
    return NextResponse.json(
      { error: "server_error", message: e instanceof Error ? e.message : "Erro ao criar checkout." },
      { status: 500 }
    );
  }
}

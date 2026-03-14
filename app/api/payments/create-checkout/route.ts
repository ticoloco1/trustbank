import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import Stripe from "stripe";

const PAYMENT_TYPES = ["VIDEO_UNLOCK", "SLUG_PURCHASE", "MINISITE_SUBSCRIPTION", "OTHER"] as const;

/**
 * POST /api/payments/create-checkout
 * Body: { type: VIDEO_UNLOCK | ..., reference_id: string, success_url?: string, cancel_url?: string, customer_email?: string }
 * Cria sessão Stripe Checkout (pagamento com cartão). Valor em USDC é cobrado em USD (1:1).
 * Após pagamento aprovado, o webhook libera acesso e o valor é repassado em USDC ao beneficiário.
 */
export async function POST(request: NextRequest) {
  const prisma = getPrisma();
  if (!prisma) return NextResponse.json({ error: "Prisma not configured" }, { status: 503 });

  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return NextResponse.json({ error: "STRIPE_SECRET_KEY não configurado" }, { status: 503 });
  }

  const stripe = new Stripe(secret);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000";

  try {
    const body = (await request.json()) as {
      type?: string;
      reference_id?: string;
      success_url?: string;
      cancel_url?: string;
      customer_email?: string;
    };
    const { type, reference_id, success_url, cancel_url, customer_email } = body;

    if (!type || !PAYMENT_TYPES.includes(type as (typeof PAYMENT_TYPES)[number])) {
      return NextResponse.json(
        { error: "invalid_type", message: "type deve ser: VIDEO_UNLOCK | SLUG_PURCHASE | MINISITE_SUBSCRIPTION | OTHER" },
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
      amountUsdc = listing.price_usdc;
      label = `Slug: ${listing.mini_site.slug || listing.mini_site.site_name || reference_id}`;
    } else if (type === "MINISITE_SUBSCRIPTION") {
      const site = await prisma.miniSite.findUnique({
        where: { id: reference_id },
        select: { slug: true, site_name: true, monthly_price_usdc: true },
      });
      if (!site?.monthly_price_usdc) {
        return NextResponse.json({ error: "minisite_no_monthly_plan" }, { status: 400 });
      }
      amountUsdc = site.monthly_price_usdc;
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
      success_url: success_url || `${baseUrl}/v/${reference_id}?paid=1`,
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

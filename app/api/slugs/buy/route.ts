import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

const PLATFORM_FEE_PERCENT = 10;

/**
 * POST /api/slugs/buy — compra um slug (mini site) listado.
 * Body: { listing_id: string, buyer_wallet: string, tx_hash?: string }
 * Fluxo: valida listing ativo → calcula 90% vendedor / 10% plataforma → transfere mini_site.user_id para comprador → marca listing como sold → cria SlugPurchase.
 * Em produção: validar tx_hash na chain (pagamento USDC recebido) antes de executar.
 */
export async function POST(request: NextRequest) {
  const prisma = getPrisma();
  if (!prisma) return NextResponse.json({ error: "Prisma not configured" }, { status: 503 });

  try {
    const body = (await request.json()) as {
      listing_id?: string;
      buyer_wallet?: string;
      tx_hash?: string;
    };
    const { listing_id, buyer_wallet, tx_hash } = body;
    if (!listing_id || !buyer_wallet) {
      return NextResponse.json(
        { error: "missing_params", message: "listing_id e buyer_wallet são obrigatórios." },
        { status: 400 }
      );
    }

    const buyer = buyer_wallet.toLowerCase();

    const listing = await prisma.slugListing.findUnique({
      where: { id: listing_id },
      include: { mini_site: true },
    });
    if (!listing) {
      return NextResponse.json({ error: "listing_not_found", message: "Listagem não encontrada." }, { status: 404 });
    }
    if (listing.status !== "active") {
      return NextResponse.json(
        { error: "not_available", message: "Este slug não está mais à venda." },
        { status: 400 }
      );
    }
    if (listing.seller_wallet === buyer) {
      return NextResponse.json(
        { error: "cannot_buy_own", message: "Você não pode comprar seu próprio slug." },
        { status: 400 }
      );
    }

    const priceNum = parseFloat(listing.price_usdc);
    if (isNaN(priceNum) || priceNum <= 0) {
      return NextResponse.json({ error: "invalid_price", message: "Preço inválido." }, { status: 400 });
    }

    const platformFee = (priceNum * PLATFORM_FEE_PERCENT) / 100;
    const sellerReceives = priceNum - platformFee;
    const platformFeeStr = platformFee.toFixed(2);
    const sellerReceivesStr = sellerReceives.toFixed(2);

    await prisma.$transaction(async (tx) => {
      await tx.slugListing.update({
        where: { id: listing_id },
        data: { status: "sold", updated_at: new Date() },
      });
      await tx.miniSite.update({
        where: { id: listing.mini_site_id },
        data: { user_id: buyer, updated_at: new Date() },
      });
      await tx.slugPurchase.create({
        data: {
          listing_id,
          buyer_wallet: buyer,
          tx_hash: tx_hash ?? null,
          amount_usdc: listing.price_usdc,
          platform_fee_usdc: platformFeeStr,
          seller_receives_usdc: sellerReceivesStr,
          status: "payout_pending",
        },
      });
    });

    const purchase = await prisma.slugPurchase.findFirst({
      where: { listing_id, buyer_wallet: buyer },
      orderBy: { completed_at: "desc" },
    });
    return NextResponse.json({
      success: true,
      purchase,
      message: "Slug adquirido. O mini site agora é seu. A plataforma enviará 90% ao vendedor (10% taxa).",
    });
  } catch (e) {
    console.error("[api/slugs/buy]", e);
    return NextResponse.json(
      { error: "server_error", message: "Erro ao processar compra." },
      { status: 500 }
    );
  }
}

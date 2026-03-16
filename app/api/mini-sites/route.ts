import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { MINISITE_MONTHLY_USD } from "@/lib/payment-config";
import { getSlugClaimTier, isFreeSlugTier } from "@/lib/slug-reserved";
import { getSlugOverridesFromDb } from "@/lib/slug-settings";

/** GET /api/mini-sites — lista mini sites (público). Query: ?slug=xxx para um por slug. */
export async function GET(request: NextRequest) {
  const prisma = getPrisma();
  if (!prisma) return NextResponse.json({ error: "Prisma not configured" }, { status: 503 });

  const slug = request.nextUrl.searchParams.get("slug")?.trim();
  if (slug) {
    const norm = slug.replace(/^@/, "").toLowerCase();
    const site = await prisma.miniSite.findFirst({
      where: { OR: [{ slug }, { slug: norm }, { slug: `@${norm}` }] },
      include: { ideas: { orderBy: { created_at: "desc" } } },
    });
    return NextResponse.json(site ?? null);
  }

  const list = await prisma.miniSite.findMany({
    orderBy: { updated_at: "desc" },
    include: { _count: { select: { ideas: true } } },
  });
  return NextResponse.json(list);
}

/** POST /api/mini-sites — criar. Slug só é aceito se já tiver sido pago (SLUG_CLAIM) por este user. */
export async function POST(request: NextRequest) {
  const prisma = getPrisma();
  if (!prisma) return NextResponse.json({ error: "Prisma not configured" }, { status: 503 });

  const body = (await request.json()) as {
    user_id?: string;
    admin_wallet?: string;
    site_name?: string;
    slug?: string;
    bio?: string;
    layout_columns?: number;
    template?: string;
    theme?: string;
    primary_color?: string;
    accent_color?: string;
    bg_color?: string;
    cotacao_symbol?: string;
    cotacao_label?: string;
  };

  const adminWallet = body.admin_wallet?.toLowerCase().trim();
  const isAdmin = adminWallet && adminWallet.startsWith("0x")
    ? !!(await prisma.adminWalletAddress.findUnique({ where: { wallet_address: adminWallet } }))
    : false;

  // Slug pode ser "ary" ou "@ary" — guardamos como informado (normalizado em minúsculas)
  const slugInput = body.slug?.trim() ?? "";
  const slugToStore = slugInput
    ? (slugInput.startsWith("@") ? `@${slugInput.slice(1).toLowerCase()}` : slugInput.toLowerCase())
    : "";
  const slugNorm = slugToStore.replace(/^@/, ""); // sem @ para checagens (payment, listing)

  if (slugToStore) {
    if (!/^@?[a-z0-9_-]+$/i.test(slugToStore)) {
      return NextResponse.json(
        { error: "invalid_slug", message: "Slug inválido. Use letras, números, hífen, underscore; @ opcional no início." },
        { status: 400 }
      );
    }
    const existingBySlug = await prisma.miniSite.findFirst({
      where: { OR: [{ slug: slugToStore }, { slug: slugNorm }, { slug: slugToStore.startsWith("@") ? slugNorm : `@${slugNorm}` }] },
    });
    if (existingBySlug) {
      return NextResponse.json(
        { error: "slug_taken", message: "Este slug já está em uso. Escolha outro ou compre no marketplace." },
        { status: 400 }
      );
    }
    const existingListing = await prisma.slugListing.findFirst({
      where: { status: "active", OR: [{ slug_value: slugNorm }, { slug_value: `@${slugNorm}` }] },
    });
    if (existingListing) {
      return NextResponse.json(
        { error: "slug_listed", message: "Este slug está à venda no marketplace. Compre em /market." },
        { status: 400 }
      );
    }
    const overrides = await getSlugOverridesFromDb();
    const tierResult = getSlugClaimTier(slugNorm, overrides);
    if (tierResult.tier === "blocked") {
      return NextResponse.json(
        { error: "slug_reserved", message: tierResult.message ?? "Este slug não pode ser usado." },
        { status: 400 }
      );
    }
    const slugIsFree = isFreeSlugTier(tierResult.tier);
    if (!isAdmin && !slugIsFree) {
      const userId = (body.user_id ?? "").toString().toLowerCase().trim();
      if (!userId || userId === "anonymous") {
        return NextResponse.json(
          { error: "payment_required", message: "Para usar este slug (premium/letra), pague em /slugs. Conecte sua carteira ou use o mesmo e-mail do pagamento." },
          { status: 402 }
        );
      }
      const isEmail = userId.includes("@");
      const paid = await prisma.payment.findFirst({
        where: {
          type: "SLUG_CLAIM",
          reference_id: slugNorm,
          status: "verified",
          ...(isEmail ? { payer_email: userId } : { payer_wallet: userId }),
        },
        orderBy: { verified_at: "desc" },
      });
      if (!paid) {
        return NextResponse.json(
          { error: "payment_required", message: `Este slug exige pagamento (${tierResult.amount_usdc} USDC). Pague em /slugs e use a mesma carteira ou e-mail ao criar o mini site.` },
          { status: 402 }
        );
      }
    }
  }

  const created = await prisma.miniSite.create({
    data: {
      user_id: body.user_id ?? "anonymous",
      site_name: body.site_name ?? null,
      slug: slugToStore || null,
      bio: body.bio ?? null,
      layout_columns: body.layout_columns ?? null,
      template: body.template ?? "default",
      theme: body.theme ?? null,
      primary_color: body.primary_color ?? null,
      accent_color: body.accent_color ?? null,
      bg_color: body.bg_color ?? null,
      cotacao_symbol: body.cotacao_symbol ?? null,
      cotacao_label: body.cotacao_label ?? null,
      subscription_plan: "monthly",
      monthly_price_usdc: MINISITE_MONTHLY_USD,
    },
  });
  return NextResponse.json(created);
}

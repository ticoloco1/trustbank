import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

const PLATFORM_FEE_PERCENT = 10;

/** GET /api/slugs — lista slugs à venda (status active). Query: ?slug=xxx para um por slug do mini site. */
export async function GET(request: NextRequest) {
  const prisma = getPrisma();
  if (!prisma) return NextResponse.json({ error: "Prisma not configured" }, { status: 503 });

  const slug = request.nextUrl.searchParams.get("slug");
  const listings = await prisma.slugListing.findMany({
    where: { status: "active" },
    include: {
      mini_site: {
        select: { id: true, site_name: true, slug: true, primary_color: true, accent_color: true, bg_color: true },
      },
    },
    orderBy: { updated_at: "desc" },
  });

  if (slug) {
    const one = listings.find((l) => l.mini_site.slug === slug);
    return NextResponse.json(one ?? null);
  }
  return NextResponse.json(listings);
}

/**
 * POST /api/slugs/list — coloca mini site (slug) à venda.
 * Body: { mini_site_id: string, seller_wallet: string, price_usdc: string }
 * Verifica se seller_wallet é o dono do mini site (user_id).
 */
export async function POST(request: NextRequest) {
  const prisma = getPrisma();
  if (!prisma) return NextResponse.json({ error: "Prisma not configured" }, { status: 503 });

  try {
    const body = (await request.json()) as {
      mini_site_id?: string;
      seller_wallet?: string;
      price_usdc?: string;
    };
    const { mini_site_id, seller_wallet, price_usdc } = body;
    if (!mini_site_id || !seller_wallet || !price_usdc) {
      return NextResponse.json(
        { error: "missing_params", message: "mini_site_id, seller_wallet e price_usdc são obrigatórios." },
        { status: 400 }
      );
    }

    const wallet = seller_wallet.toLowerCase();
    const miniSite = await prisma.miniSite.findUnique({
      where: { id: mini_site_id },
      select: { id: true, user_id: true, slug: true },
    });
    if (!miniSite) {
      return NextResponse.json({ error: "mini_site_not_found", message: "Mini site não encontrado." }, { status: 404 });
    }
    if (miniSite.user_id.toLowerCase() !== wallet) {
      return NextResponse.json(
        { error: "not_owner", message: "Só o dono do mini site pode colocá-lo à venda." },
        { status: 403 }
      );
    }
    if (!miniSite.slug) {
      return NextResponse.json({ error: "no_slug", message: "O mini site precisa ter um slug definido." }, { status: 400 });
    }

    const existing = await prisma.slugListing.findUnique({
      where: { mini_site_id },
    });
    if (existing) {
      if (existing.status === "active") {
        return NextResponse.json(
          { error: "already_listed", message: "Este mini site já está à venda." },
          { status: 400 }
        );
      }
      const updated = await prisma.slugListing.update({
        where: { id: existing.id },
        data: { seller_wallet: wallet, price_usdc, status: "active", updated_at: new Date() },
        include: { mini_site: { select: { site_name: true, slug: true } } },
      });
      return NextResponse.json(updated);
    }

    const listing = await prisma.slugListing.create({
      data: {
        mini_site_id,
        seller_wallet: wallet,
        price_usdc,
        status: "active",
      },
      include: { mini_site: { select: { site_name: true, slug: true } } },
    });
    return NextResponse.json(listing);
  } catch (e) {
    console.error("[api/slugs/list]", e);
    return NextResponse.json(
      { error: "server_error", message: "Erro ao criar listagem." },
      { status: 500 }
    );
  }
}

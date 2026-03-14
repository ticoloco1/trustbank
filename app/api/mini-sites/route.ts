import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

/** GET /api/mini-sites — lista mini sites (público). Query: ?slug=xxx para um por slug. */
export async function GET(request: NextRequest) {
  const prisma = getPrisma();
  if (!prisma) return NextResponse.json({ error: "Prisma not configured" }, { status: 503 });

  const slug = request.nextUrl.searchParams.get("slug");
  if (slug) {
    const site = await prisma.miniSite.findUnique({
      where: { slug },
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

/** POST /api/mini-sites — criar (admin: validar wallet depois). */
export async function POST(request: NextRequest) {
  const prisma = getPrisma();
  if (!prisma) return NextResponse.json({ error: "Prisma not configured" }, { status: 503 });

  const body = (await request.json()) as {
    user_id?: string;
    site_name?: string;
    slug?: string;
    bio?: string;
    layout_columns?: number;
    theme?: string;
    primary_color?: string;
    accent_color?: string;
    bg_color?: string;
    cotacao_symbol?: string;
    cotacao_label?: string;
  };

  const created = await prisma.miniSite.create({
    data: {
      user_id: body.user_id ?? "anonymous",
      site_name: body.site_name ?? null,
      slug: body.slug ?? null,
      bio: body.bio ?? null,
      layout_columns: body.layout_columns ?? null,
      theme: body.theme ?? null,
      primary_color: body.primary_color ?? null,
      accent_color: body.accent_color ?? null,
      bg_color: body.bg_color ?? null,
      cotacao_symbol: body.cotacao_symbol ?? null,
      cotacao_label: body.cotacao_label ?? null,
    },
  });
  return NextResponse.json(created);
}

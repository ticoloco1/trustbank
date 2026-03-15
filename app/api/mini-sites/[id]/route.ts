import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

/** GET /api/mini-sites/[id] */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const prisma = getPrisma();
  if (!prisma) return NextResponse.json({ error: "Prisma not configured" }, { status: 503 });
  const { id } = await params;
  const site = await prisma.miniSite.findUnique({
    where: { id },
    include: { ideas: { orderBy: { created_at: "desc" } } },
  });
  if (!site) return NextResponse.json(null, { status: 404 });
  return NextResponse.json(site);
}

/** PATCH /api/mini-sites/[id] — atualizar (admin). */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const prisma = getPrisma();
  if (!prisma) return NextResponse.json({ error: "Prisma not configured" }, { status: 503 });
  const { id } = await params;
  const body = (await request.json()) as {
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
    subscription_plan?: string;
    monthly_price_usdc?: string;
    next_billing_at?: string | null;
  };

  const data: Record<string, unknown> = {};
  if (body.site_name !== undefined) data.site_name = body.site_name;
  if (body.slug !== undefined) data.slug = body.slug;
  if (body.bio !== undefined) data.bio = body.bio;
  if (body.layout_columns !== undefined) data.layout_columns = body.layout_columns;
  if (body.template !== undefined) data.template = body.template;
  if (body.theme !== undefined) data.theme = body.theme;
  if (body.primary_color !== undefined) data.primary_color = body.primary_color;
  if (body.accent_color !== undefined) data.accent_color = body.accent_color;
  if (body.bg_color !== undefined) data.bg_color = body.bg_color;
  if (body.cotacao_symbol !== undefined) data.cotacao_symbol = body.cotacao_symbol;
  if (body.cotacao_label !== undefined) data.cotacao_label = body.cotacao_label;
  if (body.subscription_plan !== undefined) data.subscription_plan = body.subscription_plan;
  if (body.monthly_price_usdc !== undefined) data.monthly_price_usdc = body.monthly_price_usdc;
  if (body.next_billing_at !== undefined) data.next_billing_at = body.next_billing_at ? new Date(body.next_billing_at) : null;

  if (Object.keys(data).length === 0) {
    const current = await prisma.miniSite.findUnique({ where: { id } });
    return NextResponse.json(current);
  }

  type UpdateData = {
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
    subscription_plan?: string;
    monthly_price_usdc?: string;
    next_billing_at?: Date | null;
  };
  const updated = await prisma.miniSite.update({
    where: { id },
    data: data as UpdateData,
  });
  return NextResponse.json(updated);
}

import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
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
    include: {
      ideas: { orderBy: { created_at: "desc" } },
      listed_domains: { orderBy: [{ sort_order: "asc" }, { created_at: "asc" }] },
      mini_site_videos: {
        orderBy: { sort_order: "asc" },
        include: { video: { include: { quotation: true } } },
      },
    },
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
    ticker_bar_color?: string | null;
    content_order?: string | null;
    banner_url?: string | null;
    feed_image_1?: string | null;
    feed_image_2?: string | null;
    feed_image_3?: string | null;
    feed_image_4?: string | null;
    gallery_images?: { url: string; caption?: string }[] | null;
    subscription_plan?: string;
    monthly_price_usdc?: string;
    next_billing_at?: string | null;
    cv_contact_email?: string | null;
    cv_contact_phone?: string | null;
    cv_contact_whatsapp?: string | null;
    presentation_youtube_id?: string | null;
    show_cv_expandable?: boolean | null;
    site_paywall_enabled?: boolean | null;
    donation_button_enabled?: boolean | null;
    module_order?: string[] | null;
  };

  const data: Record<string, unknown> = {};
  if (body.site_name !== undefined) data.site_name = body.site_name;
  if (body.slug !== undefined) {
    const s = String(body.slug).trim();
    data.slug = s ? (s.startsWith("@") ? `@${s.slice(1).toLowerCase()}` : s.toLowerCase()) : null;
  }
  if (body.bio !== undefined) data.bio = body.bio;
  if (body.layout_columns !== undefined) data.layout_columns = body.layout_columns;
  if (body.template !== undefined) data.template = body.template;
  if (body.theme !== undefined) data.theme = body.theme;
  if (body.primary_color !== undefined) data.primary_color = body.primary_color;
  if (body.accent_color !== undefined) data.accent_color = body.accent_color;
  if (body.bg_color !== undefined) data.bg_color = body.bg_color;
  if (body.cotacao_symbol !== undefined) data.cotacao_symbol = body.cotacao_symbol;
  if (body.cotacao_label !== undefined) data.cotacao_label = body.cotacao_label;
  if (body.ticker_bar_color !== undefined) data.ticker_bar_color = body.ticker_bar_color;
  if (body.content_order !== undefined) data.content_order = body.content_order;
  if (body.banner_url !== undefined) data.banner_url = body.banner_url;
  if (body.feed_image_1 !== undefined) data.feed_image_1 = body.feed_image_1;
  if (body.feed_image_2 !== undefined) data.feed_image_2 = body.feed_image_2;
  if (body.feed_image_3 !== undefined) data.feed_image_3 = body.feed_image_3;
  if (body.feed_image_4 !== undefined) data.feed_image_4 = body.feed_image_4;
  if (body.gallery_images !== undefined) {
    const arr = Array.isArray(body.gallery_images) ? body.gallery_images : [];
    data.gallery_images = arr.filter((item: { url?: string }) => item?.url?.trim()).map((item: { url: string; caption?: string }) => ({ url: item.url.trim(), caption: item.caption?.trim() || undefined }));
  }
  if (body.subscription_plan !== undefined) data.subscription_plan = body.subscription_plan;
  if (body.monthly_price_usdc !== undefined) data.monthly_price_usdc = body.monthly_price_usdc;
  if (body.next_billing_at !== undefined) data.next_billing_at = body.next_billing_at ? new Date(body.next_billing_at) : null;
  if (body.cv_contact_email !== undefined) data.cv_contact_email = body.cv_contact_email;
  if (body.cv_contact_phone !== undefined) data.cv_contact_phone = body.cv_contact_phone;
  if (body.cv_contact_whatsapp !== undefined) data.cv_contact_whatsapp = body.cv_contact_whatsapp;
  if (body.presentation_youtube_id !== undefined) data.presentation_youtube_id = body.presentation_youtube_id;
  if (body.show_cv_expandable !== undefined) data.show_cv_expandable = body.show_cv_expandable;
  if (body.site_paywall_enabled !== undefined) data.site_paywall_enabled = body.site_paywall_enabled;
  if (body.donation_button_enabled !== undefined) data.donation_button_enabled = body.donation_button_enabled;
  if (body.module_order !== undefined) data.module_order = Array.isArray(body.module_order) ? body.module_order : null;

  if (Object.keys(data).length === 0) {
    const current = await prisma.miniSite.findUnique({ where: { id } });
    return NextResponse.json(current);
  }

  const updated = await prisma.miniSite.update({
    where: { id },
    data: data as Prisma.MiniSiteUpdateInput,
  });
  return NextResponse.json(updated);
}

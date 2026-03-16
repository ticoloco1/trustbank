import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

const SLUG_REGEX = /^[a-z0-9_-]+$/i;

/** GET /api/mini-sites/[id]/pages — lista páginas extras do mini site */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const prisma = getPrisma();
  if (!prisma) return NextResponse.json({ error: "Prisma not configured" }, { status: 503 });
  const { id } = await params;
  const pages = await prisma.miniSitePage.findMany({
    where: { mini_site_id: id },
    orderBy: [{ sort_order: "asc" }, { created_at: "asc" }],
  });
  return NextResponse.json(pages);
}

/** POST /api/mini-sites/[id]/pages — cria página/artigo */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const prisma = getPrisma();
  if (!prisma) return NextResponse.json({ error: "Prisma not configured" }, { status: 503 });
  const { id } = await params;
  const body = (await request.json()) as {
    title?: string;
    page_slug?: string;
    content_html?: string;
    background?: string;
  };
  const title = (body.title ?? "").trim();
  let page_slug = (body.page_slug ?? "").trim().toLowerCase().replace(/\s+/g, "-");
  if (!title) return NextResponse.json({ error: "title required" }, { status: 400 });
  if (!page_slug) page_slug = title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9_-]/g, "");
  if (!SLUG_REGEX.test(page_slug)) return NextResponse.json({ error: "page_slug invalid" }, { status: 400 });
  const background = (body.background ?? "default").trim() || "default";
  const allowedBg = ["default", "white", "yellow", "blue", "grey", "beige", "orange"];
  const bg = allowedBg.includes(background) ? background : "default";
  const existing = await prisma.miniSitePage.findUnique({
    where: { mini_site_id_page_slug: { mini_site_id: id, page_slug } },
  });
  if (existing) return NextResponse.json({ error: "page_slug already exists" }, { status: 400 });
  const page = await prisma.miniSitePage.create({
    data: { mini_site_id: id, title, page_slug, content_html: body.content_html ?? null, background: bg },
  });
  return NextResponse.json(page);
}

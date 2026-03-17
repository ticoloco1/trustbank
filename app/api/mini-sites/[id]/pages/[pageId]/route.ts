import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { BACKGROUND_VALUES } from "@/lib/article-page";

const ALLOWED_BG = BACKGROUND_VALUES;

/** GET — uma página */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; pageId: string }> }
) {
  const prisma = getPrisma();
  if (!prisma) return NextResponse.json({ error: "Prisma not configured" }, { status: 503 });
  const { pageId } = await params;
  const page = await prisma.miniSitePage.findFirst({
    where: { id: pageId },
  });
  if (!page) return NextResponse.json(null, { status: 404 });
  return NextResponse.json(page);
}

/** PATCH — atualiza página */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; pageId: string }> }
) {
  const prisma = getPrisma();
  if (!prisma) return NextResponse.json({ error: "Prisma not configured" }, { status: 503 });
  const { pageId } = await params;
  const body = (await request.json()) as {
    title?: string;
    page_slug?: string;
    content_html?: string;
    background?: string;
  };
  const data: Record<string, unknown> = {};
  if (body.title !== undefined) data.title = body.title.trim();
  if (body.page_slug !== undefined) {
    const slug = body.page_slug.trim().toLowerCase().replace(/\s+/g, "-");
    if (!/^[a-z0-9_-]+$/i.test(slug)) return NextResponse.json({ error: "page_slug invalid" }, { status: 400 });
    data.page_slug = slug;
  }
  if (body.content_html !== undefined) data.content_html = body.content_html;
  if (body.background !== undefined) data.background = ALLOWED_BG.includes(body.background) ? body.background : "default";
  if (Object.keys(data).length === 0) {
    const current = await prisma.miniSitePage.findUnique({ where: { id: pageId } });
    return NextResponse.json(current);
  }
  const updated = await prisma.miniSitePage.update({
    where: { id: pageId },
    data: data as { title?: string; page_slug?: string; content_html?: string; background?: string },
  });
  return NextResponse.json(updated);
}

/** DELETE — remove página */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; pageId: string }> }
) {
  const prisma = getPrisma();
  if (!prisma) return NextResponse.json({ error: "Prisma not configured" }, { status: 503 });
  const { pageId } = await params;
  await prisma.miniSitePage.delete({ where: { id: pageId } });
  return NextResponse.json({ ok: true });
}

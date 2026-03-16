import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

function toSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/\./g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

/** GET /api/mini-sites/[id]/domains — lista domínios do mini site */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const prisma = getPrisma();
  if (!prisma) return NextResponse.json({ error: "Prisma not configured" }, { status: 503 });
  const { id } = await params;
  const list = await prisma.listedDomain.findMany({
    where: { mini_site_id: id },
    orderBy: [{ sort_order: "asc" }, { created_at: "asc" }],
  });
  return NextResponse.json(list);
}

/** POST /api/mini-sites/[id]/domains — adiciona domínio ao catálogo */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const prisma = getPrisma();
  if (!prisma) return NextResponse.json({ error: "Prisma not configured" }, { status: 503 });
  const { id } = await params;
  const body = (await request.json()) as {
    name?: string;
    price?: string;
    description?: string;
    link?: string;
  };
  const name = (body.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });
  let slug = toSlug(name);
  if (!slug) slug = name.replace(/\./g, "-").toLowerCase();
  const existing = await prisma.listedDomain.findUnique({ where: { slug } });
  if (existing) {
    slug = `${slug}-${Date.now().toString(36).slice(-6)}`;
  }
  const domain = await prisma.listedDomain.create({
    data: {
      mini_site_id: id,
      name,
      slug,
      price: body.price?.trim() || null,
      description: body.description?.trim() || null,
      link: body.link?.trim() || null,
    },
  });
  return NextResponse.json(domain);
}

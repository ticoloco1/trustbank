import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

/** GET /api/ideas?mini_site_id=xxx — listar ideias de um mini site */
export async function GET(request: NextRequest) {
  const prisma = getPrisma();
  if (!prisma) return NextResponse.json({ error: "Prisma not configured" }, { status: 503 });
  const miniSiteId = request.nextUrl.searchParams.get("mini_site_id");
  if (!miniSiteId) return NextResponse.json([], { status: 200 });

  const ideas = await prisma.idea.findMany({
    where: { mini_site_id: miniSiteId },
    orderBy: { created_at: "desc" },
  });
  return NextResponse.json(ideas);
}

/** POST /api/ideas — criar ideia (admin). */
export async function POST(request: NextRequest) {
  const prisma = getPrisma();
  if (!prisma) return NextResponse.json({ error: "Prisma not configured" }, { status: 503 });
  const body = (await request.json()) as { mini_site_id: string; title?: string; content?: string };
  if (!body.mini_site_id) return NextResponse.json({ error: "mini_site_id required" }, { status: 400 });

  const idea = await prisma.idea.create({
    data: {
      mini_site_id: body.mini_site_id,
      title: body.title ?? null,
      content: body.content ?? null,
    },
  });
  return NextResponse.json(idea);
}
